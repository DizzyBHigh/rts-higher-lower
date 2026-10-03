using System;

public class CPHInline
{
    private const string EventName = "RTS - Overlay - Load Extension";
    private const string Extension = "rts-higher-lower";
    private const string ManifestUrl =
        "https://duhbuhhuh.xyz/extensions/rts-higher-lower/overlay/manifest.json";

    public bool Execute()
    {
        CPH.SetArgument("rtsOverlayExtension", Extension);
        CPH.SetArgument("rtsOverlayManifestUrl", ManifestUrl);
        CPH.TriggerEvent(EventName, true);
        return true;
    }
}
