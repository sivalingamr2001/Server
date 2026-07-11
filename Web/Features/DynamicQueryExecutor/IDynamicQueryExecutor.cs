using Dapper;
using System.Data;
using System.Data.Common;

namespace Server.Features.DynamicQueryExecutor;

/// <summary>
/// Production-grade, thread-safe contract for executing dynamic SQL and stored procedures
/// with full support for SELECT, INSERT, UPDATE, DELETE, transactions, paging, and streaming.
/// </summary>
public interface IDynamicQueryExecutor
{
    // ── SELECT Operations ─────────────────────────────────────────────────────

    /// <summary>
    /// Executes a SELECT query and returns all rows.
    /// </summary>
    Task<IEnumerable<T>> QueryAsync<T>(
        string sql,
        object? parameters = null,
        IDbTransaction? transaction = null,
        string? connectionString = null,
        int? commandTimeout = null,
        CommandType commandType = CommandType.Text,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Executes a SELECT query and returns the first row, or default if none.
    /// </summary>
    Task<T?> QueryFirstOrDefaultAsync<T>(
        string sql,
        object? parameters = null,
        IDbTransaction? transaction = null,
        string? connectionString = null,
        int? commandTimeout = null,
        CommandType commandType = CommandType.Text,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Executes a SELECT query and returns exactly one row, or default if none.
    /// Throws if more than one row is returned.
    /// </summary>
    Task<T?> QuerySingleOrDefaultAsync<T>(
        string sql,
        object? parameters = null,
        IDbTransaction? transaction = null,
        string? connectionString = null,
        int? commandTimeout = null,
        CommandType commandType = CommandType.Text,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Streams results using <see cref="DbDataReader"/> for memory-efficient large result sets.
    /// </summary>
    Task QueryStreamAsync<T>(
        string sql,
        Func<T, Task> onRow,
        object? parameters = null,
        IDbTransaction? transaction = null,
        string? connectionString = null,
        int? commandTimeout = null,
        CommandType commandType = CommandType.Text,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Executes multiple queries in one round-trip and returns a GridReader.
    /// Caller must dispose the reader.
    /// </summary>
    Task<SqlMapper.GridReader> QueryMultipleAsync(
        string sql,
        object? parameters = null,
        IDbTransaction? transaction = null,
        string? connectionString = null,
        int? commandTimeout = null,
        CommandType commandType = CommandType.Text,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Paged query: executes data SQL and count SQL on the same connection.
    /// </summary>
    Task<(IEnumerable<T> Data, int TotalCount)> QueryPagedAsync<T>(
        string dataSql,
        string countSql,
        object? parameters = null,
        IDbTransaction? transaction = null,
        string? connectionString = null,
        int? commandTimeout = null,
        CommandType commandType = CommandType.Text,
        CancellationToken cancellationToken = default);

    // ── INSERT / UPDATE / DELETE ──────────────────────────────────────────────

    /// <summary>
    /// Executes INSERT, UPDATE, DELETE, or DDL. Returns affected rows.
    /// </summary>
    Task<int> ExecuteAsync(
        string sql,
        object? parameters = null,
        IDbTransaction? transaction = null,
        string? connectionString = null,
        int? commandTimeout = null,
        CommandType commandType = CommandType.Text,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Executes a command for multiple parameter sets (bulk insert/update).
    /// </summary>
    Task<int> ExecuteBulkAsync(
        string sql,
        IEnumerable<object> parametersList,
        IDbTransaction? transaction = null,
        string? connectionString = null,
        int? commandTimeout = null,
        CommandType commandType = CommandType.Text,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Executes INSERT and returns the generated identity / primary key.
    /// </summary>
    Task<TKey?> InsertAsync<TKey>(
        string sql,
        object? parameters = null,
        IDbTransaction? transaction = null,
        string? connectionString = null,
        int? commandTimeout = null,
        CommandType commandType = CommandType.Text,
        CancellationToken cancellationToken = default);

    // ── Scalar Operations ─────────────────────────────────────────────────────

    /// <summary>
    /// Executes a query returning a single scalar value.
    /// </summary>
    Task<T?> ExecuteScalarAsync<T>(
        string sql,
        object? parameters = null,
        IDbTransaction? transaction = null,
        string? connectionString = null,
        int? commandTimeout = null,
        CommandType commandType = CommandType.Text,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Executes a query returning a single scalar value (non-generic).
    /// </summary>
    Task<object?> ExecuteScalarAsync(
        string sql,
        object? parameters = null,
        IDbTransaction? transaction = null,
        string? connectionString = null,
        int? commandTimeout = null,
        CommandType commandType = CommandType.Text,
        CancellationToken cancellationToken = default);

    // ── Transaction Management ────────────────────────────────────────────────

    /// <summary>
    /// Executes a unit of work inside a transaction with automatic commit/rollback.
    /// </summary>
    Task ExecuteInTransactionAsync(
        Func<IDbTransaction, Task> work,
        IsolationLevel isolationLevel = IsolationLevel.ReadCommitted,
        string? connectionString = null,
        int? commandTimeout = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Executes a unit of work inside a transaction and returns a result.
    /// </summary>
    Task<TResult> ExecuteInTransactionAsync<TResult>(
        Func<IDbTransaction, Task<TResult>> work,
        IsolationLevel isolationLevel = IsolationLevel.ReadCommitted,
        string? connectionString = null,
        int? commandTimeout = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Executes a query using a named connection from configuration.
    /// </summary>
    Task<IEnumerable<T>> QueryAsync<T>(
        string sql,
        string connectionName,
        object? parameters = null,
        int? commandTimeout = null,
        CommandType commandType = CommandType.Text,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Executes a command using a named connection from configuration.
    /// </summary>
    Task<int> ExecuteAsync(
        string sql,
        string connectionName,
        object? parameters = null,
        int? commandTimeout = null,
        CommandType commandType = CommandType.Text,
        CancellationToken cancellationToken = default);
}