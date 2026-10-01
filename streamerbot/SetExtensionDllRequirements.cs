// Streamer.bot C# action: define this extension's RtsUI.dll requirements.
// The generic RTS - UI DLL Check action reads these arguments.
public class CPHInline
{
    public bool Execute()
    {
        // Replace these two values when creating a new extension.
        CPH.SetArgument("rts.extensionName", "RTS Extension Template");
        CPH.SetArgument("rts.minimumRtsUiVersion", "0.1.0");
        return true;
    }
}
