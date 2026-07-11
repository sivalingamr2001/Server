namespace Server.Features.Auth;

public class LoginRequest
{
    public string Identifier { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}
