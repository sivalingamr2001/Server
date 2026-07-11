using MySqlConnector;
using System.Data;

namespace Server.Factory;

/// <summary>
/// Concrete factory implementation responsible for creating and opening high-performance MySQL database connections.
/// </summary>
public sealed class MySqlConnectionFactory(string defaultConnectionString) : IDbConnectionFactory
{
    private readonly string _defaultConnectionString = defaultConnectionString ?? throw new ArgumentNullException(nameof(defaultConnectionString));

    public async Task<IDbConnection> CreateConnectionAsync(CancellationToken cancellationToken = default)
    {
        return await CreateConnectionAsync(_defaultConnectionString, cancellationToken);
    }

    public async Task<IDbConnection> CreateConnectionAsync(string connectionString, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new ArgumentException("Connection string cannot be null or empty.", nameof(connectionString));
        }

        var connection = new MySqlConnection(connectionString);

        try
        {
            await connection.OpenAsync(cancellationToken);
            return connection;
        }
        catch
        {
            await connection.DisposeAsync();
            throw;
        }
    }
}
