using Scalar.AspNetCore;
using Serilog;
using Server;
using Server.Features.AccessRequest;
using Server.Features.Auth;
using Server.Features.DynamicQueryExecutor;
using Server.Features.Folder;
using Server.Features.Users;
using Server.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, services, loggerConfiguration) =>
{
    loggerConfiguration
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("Application", context.HostingEnvironment.ApplicationName)
        .Enrich.WithProperty("Environment", context.HostingEnvironment.EnvironmentName)
        .WriteTo.Console();
});

const string devCorsPolicy = "DevCorsPolicy";
builder.Services.AddCors(options =>
{
    options.AddPolicy(devCorsPolicy, policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddDynamicDapper(builder.Configuration);

builder.Services.AddScoped<IDynamicQueryExecutor, DynamicQueryExecutor>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAccessRequestService, AccessRequestService>();
builder.Services.AddScoped<IFolderService, FolderService>();
builder.Services.AddScoped<IUserService, UserService>();

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exceptionHandlerPathFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>();
        var exception = exceptionHandlerPathFeature?.Error;

        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(exception, "Unhandled exception: {Message}", exception?.Message);

        var status = StatusCodes.Status500InternalServerError;
        var message = "An unexpected error occurred. Please try again later.";

        switch (exception)
        {
            case MySqlConnector.MySqlException:
                status = StatusCodes.Status400BadRequest;
                message = "A database error occurred. Please check your input.";
                break;
            case InvalidOperationException:
                status = StatusCodes.Status404NotFound;
                message = exception.Message;
                break;
        }

        context.Response.StatusCode = status;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { Message = message });
    });
});

app.UseSerilogRequestLogging();
app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.UseCors(devCorsPolicy);
    app.MapOpenApi();
    app.MapScalarApiReference();
}
else
{
    app.UseCors(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
}

app.UseRouting();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();
