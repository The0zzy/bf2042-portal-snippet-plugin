(function () {
  const plugin = BF2042Portal.Plugins.getPlugin("bf2042-portal-snippet-plugin");
  const workspaceScope = _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE;

  const displayMessageXML =
    '<block  type="DisplayCustomNotificationMessage" x="122" y="1266"><value name="VALUE-0"><block type="Message"><value name="VALUE-0"><block type="Text"><field name="TEXT">MESSAGE</field></block></value></block></value><value name="VALUE-1"><block type="CustomMessagesItem"><field name="VALUE-0">CustomMessages</field><field name="VALUE-1">HeaderText</field></block></value><value name="VALUE-2"><block type="Number"><field name="NUM">-1</field></block></value></block>';

  plugin.initializeWorkspace = function () {
    //Do nothing
  };

  function insertSnippetFromUrl(url) {
    try {
      fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              "Did not receive proper response for snippet url '" + url + "'"
            );
          }
          response
            .text()
            .then((data) => {
              loadXml(data);
            })
            .catch((reason) => {
              throw new Error(
                "Couldn't parse response data for snippet url '" +
                  url +
                  "'\n" +
                  reason
              );
            });
        })
        .catch((reason) => {
          throw new Error(
            "Couldn't fetch snippet url '" + url + "'\n" + reason
          );
        });
    } catch (e) {
      logError("Failed to load Snippet!", e);
      alert("Failed to load snippet!\nCheck console for details.");
    }
  }

  function loadXml(xmlText) {
    if (!xmlText) {
      throw new Error("Encountered null value for Snippet!");
    }

    xmlText = xmlText.trim();

    if (!xmlText.startsWith("<block")) {
      throw new Error("Snippet doesn't start with a block element!");
    }

    const domText = `<xml xmlns="https://developers.google.com/blockly/xml">${xmlText.trim()}</xml>`;

    const xmlDom = _Blockly.Xml.textToDom(domText);

    //NOTE: Extract variables
    const variableBlocks = xmlDom.querySelectorAll(
      "block[type='variableReferenceBlock']"
    );
    const variables = [];

    variableBlocks.forEach((e) => {
      const objectType = e.querySelector("field[name='OBJECTTYPE']")
        .textContent;
      const variableName = e.querySelector("field[name='VAR']").textContent;

      if (
        objectType &&
        variableName &&
        !variables.find(
          (v) => v.objectType === objectType && v.variableName === variableName
        )
      ) {
        variables.push({
          objectType,
          variableName,
        });
      }
    });

    const variablesXml = document.createElement("variables");

    variables.forEach((e) => {
      const variable = document.createElement("variable");
      variable.setAttribute("type", e.objectType);
      variable.innerText = e.variableName;

      variablesXml.appendChild(variable);
    });

    _Blockly.Xml.domToVariables(variablesXml, _Blockly.getMainWorkspace());

    //NOTE: Determine a bounding box
    let minX;
    let minY;

    for (let i = 0; i < xmlDom.childNodes.length; i++) {
      const block = xmlDom.childNodes[i];

      const x = block.getAttribute("x");
      const y = block.getAttribute("y");

      if (!minX || x < minX) {
        minX = x;
      }

      if (!minY || y < minY) {
        minY = y;
      }
    }

    //NOTE: Transform blocks to the minimum coords, then move them to their target position.
    for (let i = 0; i < xmlDom.childNodes.length; i++) {
      const block = xmlDom.childNodes[i];

      const x = block.getAttribute("x");
      const y = block.getAttribute("y");

      if (x == minX) {
        block.setAttribute("x", plugin.getMouseCoords().x);
      } else {
        block.setAttribute("x", x - minX + plugin.getMouseCoords().x);
      }

      if (y == minY) {
        block.setAttribute("y", plugin.getMouseCoords().y);
      } else {
        block.setAttribute("y", y - minY + plugin.getMouseCoords().y);
      }
    }

    _Blockly.Xml.domToWorkspace(xmlDom, _Blockly.getMainWorkspace());
  }

  function getLogPrefix(messageType) {
    return "[" + pluginId + "] [" + messageType + "] - ";
  }

  function logInfo(message, data) {
    console.info(getLogPrefix("INFO") + message, data);
  }

  function logWarning(message, data) {
    console.warn(getLogPrefix("WARNING") + message, data);
  }

  function logError(message, data) {
    console.error(getLogPrefix("ERROR") + message, data);
  }

  async function buildInsertSnippetMenu() {
    try {
      let categoryMenus = [];
      let insertSnippetMenu = plugin.createMenu(
        "insertSnippetMenu",
        "Insert Snippet",
        workspaceScope
      );
      fetch(plugin.getUrl("snippets/index.json"))
        .then((response) => {
          response.json().then((data) => {
            logInfo("Retrieved snippets index:\n", data);
            data.items.forEach((item) => {
              let menuId = "insertMenu" + item.category;
              let menuName = item.category;
              let insertSnippetItem = createSnippetMenuItem(item);
              plugin.registerItem(insertSnippetItem);
              if (!categoryMenus.some((element) => menuId === element.id)) {
                let menu = plugin.createMenu(menuId, menuName, workspaceScope);
                categoryMenus.push(menu);
                plugin.registerMenu(menu);
                insertSnippetMenu.options.push("menus." + menuId);
              }
              let menu = categoryMenus.find(
                (element) => element.id === "insertMenu" + item.category
              );
              if (menu) {
                menu.options.push("items." + insertSnippetItem.id);
              } else {
                logError(
                  "Couldn't find menu '" + "insertMenu" + item.category + "'"
                );
              }
            });
          });
        })
        .catch((reason) => {
          logError("Failed to retrieve snippets index:\n", reason);
        });
    } catch (error) {
      logError("Failed to build snippets menu:\n", error);
    }
  }

  function createSnippetMenuItem(snippetIndexItem) {
    return {
      id: "insertItem" + crypto.randomUUID(),
      displayText: snippetIndexItem.name,
      scopeType: workspaceScope,
      weight: 100,
      preconditionFn: () => "enabled",
      callback: () => {
        insertSnippetFromUrl(plugin.getUrl(snippetIndexItem.url));
      },
    };
  }

  const customHeaderMessageItem = {
    id: "customHeaderMessage",
    displayText: "Custom Header Message",
    scopeType: workspaceScope,
    weight: 100,
    preconditionFn: () => "enabled",
    callback: () =>
      insertSnippetFromUrl(
        plugin.getUrl("snippets/messages/customHeaderMessage.xml")
      ),
  };

  const manageSnippetsItem = {
    id: "manageSnippets",
    displayText: "Manage Snippets",
    scopeType: workspaceScope,
    weight: 100,
    preconditionFn: () => "enabled",
    callback: () => {
      alert("Dialog to manage snippets!");
    },
  };

  const insertSnippetMessageMenu = plugin.createMenu(
    "insertSnippetMessageMenu",
    "Message",
    workspaceScope
  );
  insertSnippetMessageMenu.options = ["items.customHeaderMessage"];
  const insertSnippetVectorMenu = plugin.createMenu(
    "insertSnippetVectorMenu",
    "Vector",
    workspaceScope
  );
  insertSnippetVectorMenu.options = ["items.customHeaderMessage"];
  const insertSnippetFavouritesMenu = plugin.createMenu(
    "insertSnippetFavouritesMenu",
    "Favourites",
    workspaceScope
  );
  insertSnippetFavouritesMenu.options = ["items.customHeaderMessage"];
  const insertSnippetTemporaryMenu = plugin.createMenu(
    "insertSnippetTemporaryMenu",
    "Temporary",
    workspaceScope
  );
  insertSnippetTemporaryMenu.options = ["items.customHeaderMessage"];

  const insertSnippetMenu = plugin.createMenu(
    "insertSnippetMenu",
    "Insert Snippet",
    workspaceScope
  );
  insertSnippetMenu.options = [
    "menus.insertSnippetFavouritesMenu",
    "menus.insertSnippetTemporaryMenu",
    "items.separatorWorkspace",
    "menus.insertSnippetMessageMenu",
    "menus.insertSnippetVectorMenu",
  ];

  const snippetsMenu = plugin.createMenu(
    "snippetsMenu",
    "Snippets",
    workspaceScope
  );
  snippetsMenu.options = ["menus.insertSnippetMenu", "items.manageSnippets"];

  plugin.registerMenu(snippetsMenu);
  plugin.registerMenu(insertSnippetMenu);
  plugin.registerMenu(insertSnippetFavouritesMenu);
  plugin.registerMenu(insertSnippetTemporaryMenu);
  plugin.registerMenu(insertSnippetMessageMenu);
  plugin.registerMenu(insertSnippetVectorMenu);
  plugin.registerItem(customHeaderMessageItem);
  plugin.registerItem(manageSnippetsItem);

  _Blockly.ContextMenuRegistry.registry.register(snippetsMenu);
  /*
Block:
  Add as private Snippet

Workspace:
  Manage Snippets
  Insert Snippet >
    Favourites >
      Fav1
      Fav2
    Private >
      mySnippet1
      mySnippet2
    -----
    Vector >
      SetYawToObject
      Bounce Back Player
    Message >
      Custom Header Message
    Time
      Execute Every Second (Global)
      Execute Every Second (Team)
      Execute Every Second (Player)
    Loop >
      For
      For (array)
      While
      Tickrate
*/
})();
