using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query.SqlExpressions;

namespace SpstKniznica.Common.Data;

public static class SpstDbFunctionsModelBuilderExtensions
{
    public static ModelBuilder ConfigureSpstDbFunctions(this ModelBuilder modelBuilder)
    {
        var foldMethod = typeof(SpstDbFunctions).GetMethod(
            nameof(SpstDbFunctions.Fold),
            BindingFlags.Public | BindingFlags.Static,
            binder: null,
            types: [typeof(string)],
            modifiers: null)!;

        modelBuilder.HasDbFunction(foldMethod).HasTranslation(args =>
            new SqlFunctionExpression(
                "fold",
                args,
                nullable: true,
                argumentsPropagateNullability: [true],
                type: typeof(string),
                typeMapping: null));

        return modelBuilder;
    }
}