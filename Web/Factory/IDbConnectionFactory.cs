using System.Data;

namespace Server.Factory;

/// <summary>
/// Creates and opens <see cref="IDbConnection"/> instances.
/// Register one implementation per database vendor
/// </summary>
public interface IDbConnectionFactory
{
    /// <summary>
    /// Creates and opens a connection using the factory's default connection string.
    /// </summary>
    Task<IDbConnection> CreateConnectionAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates and opens a connection using an explicit <paramref name="connectionString"/>,
    /// enabling multi-database execution from a single factory instance.
    /// </summary>
    Task<IDbConnection> CreateConnectionAsync(string connectionString, CancellationToken cancellationToken = default);
}
