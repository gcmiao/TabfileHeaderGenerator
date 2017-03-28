# tabfile-header-generator

## Usage:

1. Make sure the tabfile which as your generate target have a comment line starts with `#type=` and follows by a type for each column which splitted by '\t' character.
1. Support type:*int, float, bool, l10n, int_array, string_array, float_array, bool_array, l10n_array*
1. The type which with prefix '_' means that `Parser:Get` will not be generated for the corresponding column, in other words, it will be ignored in programming.
1. Make sure you have a function named `OnParseLine` so that generator can insert code in it.
1. Define a tabfile path variable and assign a valid relative path to it.
1. Select tabfile path string.
1. Right click on the selected string.
1. Select 'GenerateTabfileHeader' in the context menu.
1. Several lines with `Parser:Get` will be generated in function `OnParseLine`.

```
DungeonDataTable.szFileName = "common/scene/dungeon.tab"
DungeonDataTable.tbContainer = {}

function DungeonDataTable:OnParseLine(Parser)
    local NewTemplate = {}
    NewTemplate.nId             = Parser:Get("id",                 -1, Parser.TypeInt,    true)
    NewTemplate.nResId          = Parser:Get("res_id",             -1, Parser.TypeInt,    true)
    NewTemplate.nGameModeId     = Parser:Get("game_mode_id",       -1, Parser.TypeInt,    true)
    NewTemplate.szGameMode      = Parser:Get("game_mode",          "", Parser.TypeString, true)
    NewTemplate.bIsPlane        = Parser:Get("is_plane",        false, Parser.TypeBool,   true)
    NewTemplate.szPlaneLocation = Parser:Get("plane_location",     "", Parser.TypeString, true)
    NewTemplate.nPlaneWidth     = Parser:Get("plane_width",        -1, Parser.TypeInt,    true)
    NewTemplate.nPlaneHeight    = Parser:Get("plane_height",       -1, Parser.TypeInt,    true)
    NewTemplate.nPlaneRotation  = Parser:Get("plane_rotation",     -1, Parser.TypeInt,    true)
    NewTemplate.nIdleCount      = Parser:Get("idle_count",         -1, Parser.TypeInt,    true)
    NewTemplate.nUIRadarMapId   = Parser:Get("ui_radar_map_id",    -1, Parser.TypeInt,    true)
    NewTemplate.nUIMapId        = Parser:Get("ui_map_id",          -1, Parser.TypeInt,    true)

    self.tbContainer[NewTemplate.nID] = NewTemplate     
    return true;
end
```
