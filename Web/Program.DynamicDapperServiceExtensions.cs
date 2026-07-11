using Server.Factory;
using Server.Features.DynamicQueryExecutor;

namespace Server;

/// <summary>
/// Extension methods for registering Dynamic Dapper services with fully dynamic
/// multi-database support. Reads connection strings from configuration and resolves
/// vendors at runtime based on connection string heuristics.
/// </summary>
public static class DynamicDapperServiceExtensions
{
    // ── Heuristic patterns for vendor detection ─────────────────────────────
    private static readonly Dictionary<DatabaseVendor, Func<string, bool>> VendorDetectors = new()
    {
        [DatabaseVendor.MySql] = conn =>
            conn.Contains("Server=", StringComparison.OrdinalIgnoreCase) ||
            conn.Contains("Uid=", StringComparison.OrdinalIgnoreCase) ||
            conn.Contains("Port=3306", StringComparison.OrdinalIgnoreCase) ||
            conn.Contains("AllowUserVariables", StringComparison.OrdinalIgnoreCase),

        [DatabaseVendor.Oracle] = conn =>
            conn.Contains("DATA SOURCE", StringComparison.OrdinalIgnoreCase) ||
            conn.Contains("SERVICE_NAME", StringComparison.OrdinalIgnoreCase) ||
            conn.Contains("TNS_ADMIN", StringComparison.OrdinalIgnoreCase) ||
            conn.Contains("DBA PRIVILEGE", StringComparison.OrdinalIgnoreCase),

        [DatabaseVendor.SqlServer] = conn =>
            conn.Contains("Initial Catalog=", StringComparison.OrdinalIgnoreCase) ||
            conn.Contains("Integrated Security=", StringComparison.OrdinalIgnoreCase) ||
            conn.Contains("TrustServerCertificate", StringComparison.OrdinalIgnoreCase),

        [DatabaseVendor.PostgreSql] = conn =>
            conn.Contains("Host=", StringComparison.OrdinalIgnoreCase) ||
            conn.Contains("Database=", StringComparison.OrdinalIgnoreCase) ||
            conn.Contains("SSL Mode=", StringComparison.OrdinalIgnoreCase)
    };

    /// <summary>
    /// Registers all connection strings from the "ConnectionStrings" configuration section
    /// as named factories. The first connection string is used as the default.
    /// </summary>
    /// <param name="services">The DI service collection.</param>
    /// <param name="configuration">Application configuration containing ConnectionStrings.</param>
    /// <param name="defaultConnectionName">
    /// Optional: explicit name for the default connection. 
    /// If null, the first connection string in the section becomes default.
    /// </param>
    public static IServiceCollection AddDynamicDapper(
        this IServiceCollection services,
        IConfiguration configuration,
        string? defaultConnectionName = null)
    {
        var connectionStrings = configuration.GetSection("ConnectionStrings")
            .GetChildren()
            .ToDictionary(x => x.Key, x => x.Value ?? string.Empty);

        if (connectionStrings.Count == 0)
            throw new InvalidOperationException("No connection strings found in configuration.");

        // Register all as named connection strings
        foreach (var (name, connString) in connectionStrings)
        {
            var vendor = DetectVendor(connString);
            services.AddSingleton(new NamedConnection(name, connString, vendor));
        }

        // Determine default
        var defaultName = defaultConnectionName ?? connectionStrings.First().Key;
        var defaultConn = connectionStrings[defaultName];
        var defaultVendor = DetectVendor(defaultConn);

        // Register default factory
        services.AddSingleton<IDbConnectionFactory>(sp =>
            CreateFactory(defaultVendor, defaultConn));

        // Register named factory resolver
        services.AddSingleton<INamedConnectionFactory, NamedConnectionFactory>();

        // Register executor as scoped (critical for web apps)
        services.AddScoped<IDynamicQueryExecutor, DynamicQueryExecutor>();

        return services;
    }

    /// <summary>
    /// Registers a specific connection string section by name.
    /// Use when ConnectionStrings are nested under a custom section.
    /// </summary>
    public static IServiceCollection AddDynamicDapperFromSection(
        this IServiceCollection services,
        IConfiguration configuration,
        string sectionName = "ConnectionStrings")
    {
        var section = configuration.GetSection(sectionName);
        return AddDynamicDapper(services, section);
    }

    /// <summary>
    /// Registers connection strings from an arbitrary configuration section.
    /// </summary>
    public static IServiceCollection AddDynamicDapper(
        this IServiceCollection services,
        IConfigurationSection connectionStringsSection,
        string? defaultConnectionName = null)
    {
        var connectionStrings = connectionStringsSection
            .GetChildren()
            .ToDictionary(x => x.Key, x => x.Value ?? string.Empty);

        if (connectionStrings.Count == 0)
            throw new InvalidOperationException($"No connection strings found in section '{connectionStringsSection.Path}'.");

        foreach (var (name, connString) in connectionStrings)
        {
            var vendor = DetectVendor(connString);
            services.AddSingleton(new NamedConnection(name, connString, vendor));
        }

        var defaultName = defaultConnectionName ?? connectionStrings.First().Key;
        var defaultConn = connectionStrings[defaultName];
        var defaultVendor = DetectVendor(defaultConn);

        services.AddSingleton<IDbConnectionFactory>(_ =>
            CreateFactory(defaultVendor, defaultConn));

        services.AddSingleton<INamedConnectionFactory, NamedConnectionFactory>();
        services.AddScoped<IDynamicQueryExecutor, DynamicQueryExecutor>();

        return services;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    private static DatabaseVendor DetectVendor(string connectionString)
    {
        foreach (var (vendor, detector) in VendorDetectors)
        {
            if (detector(connectionString))
                return vendor;
        }

        // Default fallback: MySQL (most common in your stack)
        return DatabaseVendor.MySql;
    }

    private static IDbConnectionFactory CreateFactory(DatabaseVendor vendor, string connectionString)
    {
        return vendor switch
        {
            DatabaseVendor.MySql => new MySqlConnectionFactory(connectionString),
            DatabaseVendor.Oracle => new OracleConnectionFactory(connectionString),
            _ => throw new NotSupportedException($"Vendor '{vendor}' is not yet supported.")
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════
//  SUPPORTING TYPES
// ═══════════════════════════════════════════════════════════════════════

/// <summary>
/// Identifies the database vendor.
/// </summary>
public enum DatabaseVendor
{
    MySql,
    Oracle,
    SqlServer,
    PostgreSql
}

/// <summary>
/// A named connection with auto-detected vendor.
/// </summary>
public sealed record NamedConnection(
    string Name,
    string ConnectionString,
    DatabaseVendor Vendor);

/// <summary>
/// Resolves named connections at runtime.
/// </summary>
public interface INamedConnectionFactory
{
    /// <summary>
    /// Gets a connection factory for the named connection.
    /// </summary>
    IDbConnectionFactory GetFactory(string name);

    /// <summary>
    /// Gets the raw connection string for the named connection.
    /// </summary>
    string GetConnectionString(string name);

    /// <summary>
    /// Gets all registered connection names.
    /// </summary>
    IEnumerable<string> GetConnectionNames();
}

/// <summary>
/// Runtime resolver for named database connections.
/// </summary>
public sealed class NamedConnectionFactory : INamedConnectionFactory
{
    private readonly IReadOnlyDictionary<string, NamedConnection> _connections;

    public NamedConnectionFactory(IEnumerable<NamedConnection> connections)
    {
        _connections = connections.ToDictionary(c => c.Name, StringComparer.OrdinalIgnoreCase);
    }

    public IDbConnectionFactory GetFactory(string name)
    {
        if (!_connections.TryGetValue(name, out var conn))
            throw new ArgumentException($"No connection named '{name}' is registered. Available: {string.Join(", ", _connections.Keys)}", nameof(name));

        return conn.Vendor switch
        {
            DatabaseVendor.MySql => new MySqlConnectionFactory(conn.ConnectionString),
            DatabaseVendor.Oracle => new OracleConnectionFactory(conn.ConnectionString),
            _ => throw new NotSupportedException($"Vendor '{conn.Vendor}' not supported for connection '{name}'.")
        };
    }

    public string GetConnectionString(string name)
    {
        if (!_connections.TryGetValue(name, out var conn))
            throw new ArgumentException($"No connection named '{name}' is registered.", nameof(name));

        return conn.ConnectionString;
    }

    public IEnumerable<string> GetConnectionNames() => _connections.Keys;
}