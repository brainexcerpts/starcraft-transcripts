
<img src="https://rodolphe-vaillant.fr/images/2021-10/starcraft_transcript_terran_banner.jpg" title=""  alt="" >

Welcome to this English and Japanese transcript of the "StarCraft® 1998" campaign!     
(property of Blizzard Entertainment®)

「StarCraft® 1998」キャンペーンの英語と日本語のトランスクリプト・文字起こしへようこそ！    
(Blizzard Entertainment® の所有物)


<img src="doc/preview.webp" title=""  alt="" >

Original version is free to play or you can also buy the remaster:
https://starcraft.com/





Instructions
------------

I recommend using "vscode" to edit and view the files of this project.
You must launch template.html using a webserver, otherwise JS code won't
properly execute. The easiest way is to open the project with vscode
install the "Live Server" plugin and launch template.html with a right click
-> "Open to Live Server". template.html should output the same as terran.html
terran.html should not be edited this is automatically generated content
(copy paste from template.html). terran.html should not need a webserver
and can be opened as is for anyone to use offline easily.


Editing
-------

Set it to use tabs and not spaces
<pre> </pre> tag  will preserve line returns

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


Note: we name files .htmlr and not .html,
is to make custom shortcuts (added inside vscode) to only apply to the extension .htmlr


Parsing
-------

The transcript is divided into several ".htmlr" files.
Those will be parsed and put together to produce the final html file
with proper styling and functionalities like play button for audio and icons to switch between languages.
See parser.js.


Editor
------

To improve productivity I recommend:

 - github copilot plugin
 - html wrapper plugin
 - Code Spell Checker plugin (English pack etc)
 - Auto Rename Tag plugin
 - Auto close Tag plugin
 - Live Server plugin
 - in VS CODE:  setup: 'keybindings.json' to rapidly generate tags and class
 (manage -> Keyboard shortcuts then press icon to edit json)
  find an example of 'keybindings.json' in the root of this project.

