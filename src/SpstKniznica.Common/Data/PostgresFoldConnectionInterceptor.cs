using System.Collections.Concurrent;
using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace SpstKniznica.Common.Data;

/// <summary>
/// Ensures SQL function <c>fold(text)</c> exists (accent-fold + lower) for EF <see cref="SpstDbFunctions.Fold"/>.
/// </summary>
public sealed class PostgresFoldConnectionInterceptor : DbConnectionInterceptor
{
    private static readonly ConcurrentDictionary<string, byte> Ensured = new(StringComparer.Ordinal);

    private const string EnsureFoldSql =
        """
        CREATE OR REPLACE FUNCTION fold(value text)
        RETURNS text
        LANGUAGE sql
        IMMUTABLE
        PARALLEL SAFE
        AS $fn$
          SELECT CASE
            WHEN value IS NULL THEN NULL
            ELSE lower(
              translate(
                value,
                'ÁÄÄáääÂâÀàČčĆćĎďÉéĚěËëÈèÍíÎîÌìĹĺĽľŇňŃńÓóÔôÖöÒòŔŕŘřŠšŚśŤťÚúŮůÜüÙùÝýŽžŹźß',
                'AAAAAAAACCCDDEEEEEEEEIIIIIIILLLLNNNNOOOOOOOORRRRSSSSTTUUUUUUUUYYZZZZss'
              )
            )
          END;
        $fn$;
        """;

    public override void ConnectionOpened(DbConnection connection, ConnectionEndEventData eventData)
    {
        EnsureFold(connection);
        base.ConnectionOpened(connection, eventData);
    }

    public override async Task ConnectionOpenedAsync(
        DbConnection connection,
        ConnectionEndEventData eventData,
        CancellationToken cancellationToken = default)
    {
        await EnsureFoldAsync(connection, cancellationToken);
        await base.ConnectionOpenedAsync(connection, eventData, cancellationToken);
    }

    private static void EnsureFold(DbConnection connection)
    {
        var key = connection.Database + "|" + (connection.DataSource ?? connection.ConnectionString);
        if (!Ensured.TryAdd(key, 0))
        {
            return;
        }

        using var command = connection.CreateCommand();
        command.CommandText = EnsureFoldSql;
        command.ExecuteNonQuery();
    }

    private static async Task EnsureFoldAsync(DbConnection connection, CancellationToken cancellationToken)
    {
        var key = connection.Database + "|" + (connection.DataSource ?? connection.ConnectionString);
        if (!Ensured.TryAdd(key, 0))
        {
            return;
        }

        await using var command = connection.CreateCommand();
        command.CommandText = EnsureFoldSql;
        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}
