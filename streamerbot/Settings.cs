// Streamer.bot C# action: open the extension settings window.
// Requires RtsUI.dll to be available as a custom assembly reference.
public class CPHInline
{
    public bool Execute()
    {
        var ui = new RtsUI(
            "RTS Extension Template",
            "0.1.0",
            (key, persisted) => CPH.GetGlobalVar<bool?>(key, persisted),
            (key, persisted) => CPH.GetGlobalVar<int?>(key, persisted),
            (key, persisted) => CPH.GetGlobalVar<string>(key, persisted),
            (key, persisted) => CPH.GetGlobalVar<object>(key, persisted),
            (key, value, persisted) => CPH.SetGlobalVar(key, value, persisted),
            message => CPH.LogInfo(message));

        // Replace this example with the extension's RtsUI settings.
        ui.AddTitle("Extension Settings", "General");
        ui.ShowUI();
        return true;
    }
}
