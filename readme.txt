

Welcome to this English and Japanese transcript of the "StarCraft® 1998" campaign
(property of Blizzard Entertainment®)


Instructions
------------

I recommend using "vscode" to edit the files of this project
Set it to use tabs and not spaces
<pre> </pre> tag  will preserve line returns

Parsing
-------

The transcript is divided into several ".htmlr" files.
Those will be parsed and put together to produce the final html file
with proper styling and functionalities like play button for audio and icons to switch between languages.
See parser.js.

In a .htmlr:

You can use Markdown like lists:
- bla
- foo

It will be converted to html tags ul li.

You can use the syntax
漢字[かんじ]
which will be converted to
<ruby>漢字<rt>かんじ</rt></ruby>
this allows to display the furigana when hovering the kanji inside the browser.
note that you need a *space* before the kanji ' '漢字[かんじ] for the conversion to
happen, a tab or a wider character space won't do.
Sometimes I omit the space and only put a tab in front of 漢字[かんじ],
this is on purpose so it won't gets converted to ruby syntax and will be displayed verbatim.


One reason we name files .htmlr and not .html,
is to make custom shortcuts (added inside vscode) to only apply to the extension .htmlr

Editor
------

To improve productivity:
 - I recommend github copilot
 - in VS CODE:  setup: 'keybindings.json' to rapidly generate tags and class
 (manage -> Keyboard shortcuts then press icon to edit json)
  find an example of 'keybindings.json' in the root of this project.

