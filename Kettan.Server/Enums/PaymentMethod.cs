namespace Kettan.Server.Enums;

public enum PaymentMethod : byte
{
    Card = 0,
    Checkout = 0,   // Alias for Card
    GCash = 1,
    Maya = 2,
    BankTransfer = 3,
    Cash = 4
}
