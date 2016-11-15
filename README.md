# tabfile-header-generator README

## Usage:

1. make sure the tabfile which as your generate target have a comment line starts with '#type = ' and follows by a type for each column which splitted by '\t' character.
1. make sure you have a function named 'OnParseLine' so that generator can insert code in it.
2. define a tabfile path variable and assign a valid relative path to it.
3. select tabfile path string.
4. right click on the selected string.
5. select 'GenerateTabfileHeader' in the context menu.
