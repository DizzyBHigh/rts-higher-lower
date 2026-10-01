using System;
using System.Collections.Generic;

public class CPHInline
{
    public bool Execute()
    {
        var data = new
        {
            round = 4,
            players = new[]
            {
                new { name = "DuhBuhHuh", vote = "Higher", bet = 5000 },
                new { name = "Johnny", vote = "Lower", bet = 1000 },
                new { name = "Dawn", vote = "Lower", status = "BANK", bet = 0 },
                new { name = "JayGeeX", vote = "Higher", bet = 2000 },
                new { name = "Bobby", vote = "Higher", bet = 2000 }
            },
            roundTotal = 10000,
            potTotal = 28000
        };

        var json = System.Text.Json.JsonSerializer.Serialize(data);

        var args = new Dictionary<string, object>
        {
            ["rtsOverlayExtension"] = "rts-higher-lower",
            ["rtsOverlayCommand"] = "state",
            ["rtsOverlayData"] = json
        };

        CPH.RunAction("RTS - Overlay - Extension Command", true, args);
        return true;
    }
}
