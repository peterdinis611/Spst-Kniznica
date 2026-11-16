using System.Data.Common;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore.Diagnostics;
using SpstKniznica.Common.Text;

namespace SpstKniznica.Common.Data;

public sealed class SqliteFoldConnectionInterceptor : DbConnectionInterceptor
{
    public override void ConnectionOpened(DbConnection connection, ConnectionEndEventData eventData)
    {
        RegisterFold(connection);
        base.ConnectionOpened(connection, eventData);
    }

    public override Task ConnectionOpenedAsync(
        DbConnection connection,
        ConnectionEndEventData eventData,
        CancellationToken cancellationToken = default)
    {
        RegisterFold(connection);
        return base.ConnectionOpenedAsync(connection, eventData, cancellationToken);
    }

    private static void RegisterFold(DbConnection connection)
    {
        if (connection is not SqliteConnection sqlite)
        {
            return;
        }

        sqlite.CreateFunction(
            "fold",
            (string? arg) => TextFold.Fold(arg),
            isDeterministic: true);
    }
}