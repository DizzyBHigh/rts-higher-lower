RTS Higher Lower Game
Streamer Bot Mappings

Naming convention:
Streamer.bot Action names and their Execute Code or Execute Method action names use the same name.
Overlay requestAction calls always target the Streamer.bot Action name.

RTS - Higher Lower Game - Connector : Custom Trigger(RTS - Higher Lower Game)

RTS - Higher Lower Game - Core : Execute Code(RTS - Higher Lower Game - Core) - streamerbot\RTSHigherLowerGame.cs

RTS - Higher Lower Game - Bank : Execute Method(RTS - Higher Lower Game - Core, Bank)
Commands: !bank

RTS - Higher Lower Game - Join : Execute Method(RTS - Higher Lower Game - Core, Join)
Commands: !join

RTS - Higher Lower Game - Create Game : Execute Method(RTS - Higher Lower Game - Core, CreateGame)
Commands: !createGame

RTS - Higher Lower Game - Start Game : Execute Method(RTS - Higher Lower Game - Core, StartGame)
Internal: registration timer completion

RTS - Higher Lower Game - Reset : Execute Method(RTS - Higher Lower Game - Core, Reset)
Commands: !rts-hl-reset

RTS - Higher Lower Game - Vote : Execute Method(RTS - Higher Lower Game - Core, Vote)
Commands: !vote <higher|lower> <amount>

RTS - Higher Lower Game - Layout : Execute Method(RTS - Higher Lower Game - Core, Layout)
Commands: !rts-hl-layout <layoutname>
