(function () {
  const pluginId = "bf2042-portal-snippet-plugin";
  const plugin = BF2042Portal.Plugins.getPlugin(pluginId);
  const workspaceScope = _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE;

  plugin.initializeWorkspace = function () {};

  function insertSnippetFromUrl(url) {
    try {
      fetch(url)
        .then((response) => {
          if (!response.ok) {
            logError(
              "Did not receive proper response for snippet url '" + url + "'"
            );
          } else {
            response
              .text()
              .then((data) => {
                logInfo("Retrieved following snippet data:\n", data);
                try {
                  loadXml(data);
                } catch (error) {
                  logError("Failed to load snippet to workspace!", error);
                }
              })
              .catch((reason) => {
                logError(
                  "Couldn't parse response data for snippet url '" +
                    url +
                    "'\n" +
                    reason
                );
              });
          }
        })
        .catch((reason) => {
          logError("Couldn't fetch snippet url '" + url + "'\n" + reason);
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

  function buildInsertSnippetMenu() {
    try {
      logInfo("Creating Snippets Menu...");
      let categoryMenus = [];
      fetch(plugin.getUrl("snippets/index.json"))
        .then((response) => {
          response.json().then((data) => {
            logInfo("Retrieved snippets index:\n", data);
            data.items.forEach((item) => {
              let menuId = "insertMenu" + item.category;
              let menuName = item.category;
              let insertSnippetItem = {
                id: "insertItem" + crypto.randomUUID(),
                displayText: item.name,
                scopeType: workspaceScope,
                weight: 100,
                preconditionFn: () => "enabled",
                callback: () => {
                  insertSnippetFromUrl(plugin.getUrl(item.url));
                },
              };
              plugin.registerItem(insertSnippetItem);
              if (!categoryMenus.some((element) => menuId === element.id)) {
                let menu = plugin.createMenu(menuId, menuName, workspaceScope);
                categoryMenus.push(menu);
                plugin.registerMenu(menu);
                insertSnippetMenu.options.push("menus." + menuId);
                logInfo("Created Snippets Sub-Menu '" + menuName + "'");
              }
              let menu = categoryMenus.find(
                (element) => element.id === "insertMenu" + item.category
              );
              if (menu) {
                menu.options.push("items." + insertSnippetItem.id);
                logInfo(
                  "Added Snippet '" + insertSnippetItem.displayText + "'"
                );
              } else {
                logError(
                  "Couldn't find menu '" + "insertMenu" + item.category + "'"
                );
              }
            });
            logInfo("Created Snippets Menu!");
          });
        })
        .catch((reason) => {
          logError("Failed to retrieve snippets index:\n", reason);
        });
    } catch (error) {
      logError("Failed to build snippets menu:\n", error);
    }
  }

  const manageSnippetsItem = {
    id: "manageSnippets",
    displayText: "Manage Snippets",
    scopeType: workspaceScope,
    weight: 100,
    preconditionFn: () => "enabled",
    callback: () => {
      alert("Dialog to manage snippets coming soon!");
    },
  };

  const emptySnippetItem = {
    id: "emptySnippetItem",
    displayText: "empty",
    scopeType: workspaceScope,
    weight: 100,
    preconditionFn: () => "disabled",
    callback: () => {},
  };

  const insertSnippetFavouritesMenu = plugin.createMenu(
    "insertSnippetFavouritesMenu",
    "Favourites",
    workspaceScope
  );
  insertSnippetFavouritesMenu.options = ["items.emptySnippetItem"];

  const insertSnippetPrivateMenu = plugin.createMenu(
    "insertSnippetPrivateMenu",
    "Private",
    workspaceScope
  );
  insertSnippetPrivateMenu.options = ["items.emptySnippetItem"];

  const insertSnippetMenu = plugin.createMenu(
    "insertSnippetMenu",
    "Insert Snippet",
    workspaceScope
  );
  insertSnippetMenu.options = [
    "menus.insertSnippetFavouritesMenu",
    "menus.insertSnippetPrivateMenu",
    "items.separatorWorkspace",
  ];

  const snippetsMenu = plugin.createMenu(
    "snippetsMenu",
    "Snippets",
    workspaceScope
  );
  snippetsMenu.options = ["menus.insertSnippetMenu", "items.manageSnippets"];

  buildInsertSnippetMenu();

  plugin.registerMenu(snippetsMenu);
  plugin.registerMenu(insertSnippetMenu);
  plugin.registerMenu(insertSnippetFavouritesMenu);
  plugin.registerMenu(insertSnippetPrivateMenu);
  plugin.registerItem(emptySnippetItem);
  plugin.registerItem(manageSnippetsItem);

  _Blockly.ContextMenuRegistry.registry.register(snippetsMenu);
})();
