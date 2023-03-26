# BF2042 Portal - Code Snippet Plugin

## About

This is a plugin for the [Battlefield Portal Browser Extension](https://github.com/LennardF1989/BF2042-Portal-Extensions) to provide code snippets to insert into the workspace of the Battlefield 2042 Portal Rules Editor.

## Install

1. Install the [Battlefield Portal Browser Extension](https://github.com/LennardF1989/BF2042-Portal-Extensions)
   - Chrome: https://chrome.google.com/webstore/detail/bf2042-portal-extensions/ojegdnmadhmgfijhiibianlhbkepdhlj
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/bf2042-portal-extensions/
2. Pin the extension to be able to click on it
3. Click on the extension icon > `Options`
4. Click on `Add plugin` and enter the following url

```txt
https://the0zzy.github.io/bf2042-portal-snippet-plugin/manifest.json
```

## Features

- List of predefined code snippets you can insert to your experience / workspace
- Create and manage your own private snippets
- Add snippets to a favourites list for faster use

## How to use

### Insert Code Snippet

1. Right click on the workspace (not on a block)
2. In the opening context menu select `Insert Snippet`
3. Select the according category of the snippet
   - Favourites: Snippets you marked as your favourites
   - Private: Snippets that you created on your own
   - Other Categories: Predefined categories and snippets
4. Click on the snippet name you want to insert

![insertSnippet01](/docs/images/insertSnippet01.png "insertSnippet01")
![insertSnippet02](/docs/images/insertSnippet02.png "insertSnippet02")
![insertSnippet03](/docs/images/insertSnippet03.png "insertSnippet03")

![insertSnippet04](/docs/images/insertSnippet04.png "insertSnippet04")

### Manage Code Snippets

With the "Manage Dialog" you can

- add and remove favourites
- create and delete your own private snippets
- browse predefined snippets
- insert snippets to the workspace

To open the manage dialog, right-click on the workspace (not on a block) and select `Manage Snippets` from the context menu.

![manageDialog](/docs/images/manageDialog.png "manageDialog")

### Create your own private Code Snippet

1. Open the manage dialog
2. Click on `[Add New]` in the "private" section
3. In the Edit Dialog that was openend, you can define the name and content of your snippet

The content of a snippet is the underlying Blockly XML Code.  
Such code can be obtained by using the `Copy to Clipboard` function of the [Battlefield Portal Browser Extension](https://github.com/LennardF1989/BF2042-Portal-Extensions).

![editDialog](/docs/images/editDialog.png "editDialog")

## Contribute Predefined Snippets

You think that an important frequently used snippet is missing or needs to be changed?  
Then feel free to open a pull-request to this repository with the missing snippet added in the following way:

1. Add the snippet as xml file in an according sub-folder in `snippets`
2. Add a reference to your snippet in the `snippets/index.json` file
   - Use the sub-folder name as `category`
   - use the filename (without extension) as `id`
   - Give the relative path to your snippet as `url`
   - give a user friendly short `name` and `description`
