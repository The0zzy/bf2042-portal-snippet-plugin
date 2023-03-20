(function () {
  const pluginId = "bf2042-portal-snippet-plugin";
  const plugin = BF2042Portal.Plugins.getPlugin(pluginId);
  const workspaceScope = _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE;
  const blockScope = _Blockly.ContextMenuRegistry.ScopeType.BLOCK;
  let pluginData = {
    favourites: [],
    privates: [],
    predefined: [],
  };

  function hideDialog() {
    document.getElementById("dialogBackdrop").style.display = "none";
  }

  function showManageDialog() {
    showDialog(plugin.getUrl("view/manage.html"), initManageDialog);
  }

  function showEditDialog(id) {
    showDialog(plugin.getUrl("view/edit.html"), () => {
      initEditDialog(id);
    });
  }

  function initEditDialog(id) {
    document
      .getElementById("dialogClose")
      .addEventListener("click", showManageDialog);
    document
      .getElementById("dialogButtonOk")
      .addEventListener("click", showManageDialog);
    document
      .getElementById("dialogButtonCancel")
      .addEventListener("click", showManageDialog);
    document
      .getElementById("dialogBackdrop")
      .addEventListener("click", () => {});
    if (id) {
      let editItem = pluginData.privates.find((element) => {
        element.id === id;
      });
      if (editItem) {
        document.getElementById("snippetName").value = editItem.name;
        document.getElementById("snippetContent").innerText = editItem.xml;
      }
    } else {
    }
  }

  function addFavorite(id) {
    let favIndex = pluginData.favourites.indexOf(id);
    if (favIndex == -1) {
      pluginData.favourites.push(id);
    }
    savePluginData();
    buildInsertSnippetMenu();
  }

  function removeFavorite(id) {
    let favIndex = pluginData.favourites.indexOf(id);
    if (favIndex > -1) {
      pluginData.favourites.splice(favIndex, 1);
    }
    savePluginData();
    buildInsertSnippetMenu();
  }

  function removePrivate(id) {
    let favIndex = pluginData.privates.indexOf(id);
    if (favIndex > -1) {
      pluginData.privates.splice(favIndex, 1);
    }
    savePluginData();
    buildInsertSnippetMenu();
  }

  function initManageDialog() {
    document
      .getElementById("dialogClose")
      .addEventListener("click", hideDialog);
    document
      .getElementById("dialogButtonOk")
      .addEventListener("click", hideDialog);
    document
      .getElementById("dialogButtonCancel")
      .addEventListener("click", hideDialog);
    document.getElementById("dialogBackdrop").addEventListener("click", (e) => {
      if (e.target === dialogBackdrop) {
        hideDialog();
      }
    });

    let favList = document.getElementById("favList");
    favList.innerHTML = "";
    pluginData.favourites.forEach((item) => {
      let favItem = document.createElement("li");
      let itemText = document.createElement("span");
      itemText.innerText = item.name + "&nbsp&nbsp&nbsp";
      favItem.appendChild(itemText);
      let itemLink = document.createElement("a");
      itemLink.innerText = "[remove]";
      itemLink.addEventListener("click", () => {
        removeFavorite(item.id);
        initManageDialog();
      });
      favItem.appendChild(itemLink);
      favList.appendChild(favItem);
    });

    let privList = document.getElementById("privList");
    privList.innerHTML = "";
    pluginData.privates.forEach((item) => {
      let privItem = document.createElement("li");
      let itemText = document.createElement("span");
      itemText.innerText = item.name + "&nbsp&nbsp&nbsp";
      privItem.appendChild(itemText);

      let itemLink = document.createElement("a");
      itemLink.innerText = "[edit]";
      itemLink.addEventListener("click", () => {
        showEditDialog(item.id);
      });
      privItem.appendChild(itemLink);

      itemLink = document.createElement("a");
      itemLink.innerText = "[favor]";
      itemLink.addEventListener("click", () => {
        addFavorite(item.id);
        initManageDialog();
      });
      privItem.appendChild(itemLink);

      itemLink = document.createElement("a");
      itemLink.innerText = "[delete]";
      itemLink.addEventListener("click", () => {
        removePrivate(item.id);
        initManageDialog();
      });
      privItem.appendChild(itemLink);
      privList.appendChild(privItem);
    });

    document
      .getElementById("addPrivateSnippet")
      .addEventListener("click", () => {
        showDialog(plugin.getUrl("view/edit.html"), () => {
          document
            .getElementById("dialogClose")
            .addEventListener("click", showManageDialog);
          document
            .getElementById("dialogButtonOk")
            .addEventListener("click", showManageDialog);
          document
            .getElementById("dialogButtonCancel")
            .addEventListener("click", showManageDialog);
          document
            .getElementById("dialogBackdrop")
            .addEventListener("click", () => {});
        });
      });
  }

  function showDialog(dialogUrl, initFn) {
    try {
      fetch(dialogUrl)
        .then((response) => {
          if (!response.ok) {
            logError(
              "Did not receive proper response for manage dialog url '" +
                url +
                "'"
            );
          } else {
            response
              .text()
              .then((data) => {
                logInfo("Retrieved following dialog data:\n", data);
                let dialogDoc = new DOMParser().parseFromString(
                  data,
                  "text/html"
                );
                let dialogBackdrop = dialogDoc.getElementById("dialogBackdrop");
                let styleLink = dialogDoc.head.querySelector("link");
                styleLink.setAttribute(
                  "href",
                  plugin.getUrl(styleLink.getAttribute("href"))
                );
                document.head.appendChild(styleLink);
                let existingBackdrop =
                  document.getElementById("dialogBackdrop");
                if (existingBackdrop) {
                  document.body.removeChild(existingBackdrop);
                }
                document.body.appendChild(dialogBackdrop);
                initFn();
              })
              .catch((reason) => {
                logError(
                  "Couldn't parse response data for dialog url '" +
                    dialogUrl +
                    "'\n" +
                    reason
                );
              });
          }
        })
        .catch((reason) => {
          logError("Couldn't fetch dialog url '" + dialogUrl + "'\n" + reason);
        });
    } catch (e) {
      logError("Failed to open dialog!", e);
      alert("Failed to open dialog!\nCheck console for details.");
    }
  }

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
                insertSnippetFromText(data);
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

  function insertSnippetFromText(xmlText) {
    try {
      loadXml(xmlText);
    } catch (error) {
      logError("Failed to load snippet to workspace!", error);
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
      const objectType = e.querySelector(
        "field[name='OBJECTTYPE']"
      ).textContent;
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
      let predefinedCategoryMenus = [];
      insertSnippetMenu.options = [];
      insertSnippetMenu.options = [
        "menus.insertSnippetFavouritesMenu",
        "menus.insertSnippetPrivateMenu",
        "items.separatorWorkspace",
      ];
      logInfo("Creating Snippets Menu...");
      insertSnippetPrivateMenu.options = ["items.emptySnippetItem"];
      pluginData.privates.forEach((item) => {
        const privateSnippetItem = {
          id: item.id,
          displayText: item.name,
          scopeType: workspaceScope,
          weight: 100,
          preconditionFn: () => "enabled",
          callback: () => {
            insertSnippetFromText(item.xml);
          },
        };

        plugin.registerItem(privateSnippetItem);

        if (
          insertSnippetPrivateMenu.options.length == 1 &&
          insertSnippetPrivateMenu.options[0] == "items.emptySnippetItem"
        ) {
          insertSnippetPrivateMenu.options.pop();
        }
        insertSnippetPrivateMenu.options.push("items." + privateSnippetItem.id);

        if (
          pluginData.favourites.find((element) => {
            element === privateSnippetItem.id;
          })
        ) {
          if (
            insertSnippetFavouritesMenu.options.length == 1 &&
            insertSnippetFavouritesMenu.options[0] == "items.emptySnippetItem"
          ) {
            insertSnippetFavouritesMenu.options.pop();
          }
          insertSnippetFavouritesMenu.options.push(
            "items." + privateSnippetItem.id
          );
        }
      });

      pluginData.predefined.forEach((item) => {
        let menuId = "insertMenu" + item.category;
        let menuName = item.category;
        let menu = null;
        if (
          !insertSnippetMenu.options.some(
            (element) => element === "menus." + menuId
          )
        ) {
          menu = plugin.createMenu(menuId, menuName, workspaceScope);
          plugin.registerMenu(menu);
          insertSnippetMenu.options.push("menus." + menuId);
          predefinedCategoryMenus.push(menu);
          logInfo("Created Snippets Sub-Menu '" + menuName + "'");
        }
        menu = predefinedCategoryMenus.find((element) => element.id === menuId);
        if (
          !menu.options.some((element) => {
            element === "items." + item.id;
          })
        ) {
          let insertSnippetItem = {
            id: item.id,
            displayText: item.name,
            scopeType: workspaceScope,
            weight: 100,
            preconditionFn: () => "enabled",
            callback: () => {
              insertSnippetFromUrl(plugin.getUrl(item.url));
            },
          };
          plugin.registerItem(insertSnippetItem);
          menu.options.push("items." + insertSnippetItem.id);
          logInfo("Added Snippet '" + insertSnippetItem.displayText + "'");

          if (
            pluginData.favourites.find((element) => {
              element === insertSnippetItem.id;
            })
          ) {
            if (
              insertSnippetFavouritesMenu.options.length == 1 &&
              insertSnippetFavouritesMenu.options[0] == "items.emptySnippetItem"
            ) {
              insertSnippetFavouritesMenu.options.pop();
            }
            insertSnippetFavouritesMenu.options.push(
              "items." + insertSnippetItem.id
            );
          }
        }
      });
      logInfo("Created Snippets Menu!");
    } catch (error) {
      logError("Failed to build snippets menu:\n", error);
    }
  }

  function blockToXml(block) {
    const xmlDom = _Blockly.Xml.blockToDomWithXY(block, true);
    _Blockly.Xml.deleteNext(xmlDom);

    const xmlText = _Blockly.Xml.domToText(xmlDom).replace(
      'xmlns="https://developers.google.com/blockly/xml"',
      ""
    );

    return xmlText;
  }

  function saveXml(blocks) {
    const workspace = _Blockly.getMainWorkspace();

    try {
      let xmlText = "";

      if (blocks && blocks.length > 0) {
        for (let i = 0; i < blocks.length; i++) {
          xmlText += blockToXml(blocks[i]);
        }

        return xmlText;
      } else {
        let xmlDom = _Blockly.Xml.workspaceToDom(workspace, true);

        const variablesXml = xmlDom.querySelector("variables");

        if (variablesXml) {
          xmlDom.removeChild(variablesXml);
        }

        return _Blockly.Xml.domToText(xmlDom)
          .replace(
            '<xml xmlns="https://developers.google.com/blockly/xml">',
            ""
          )
          .replace("</xml>", "");
      }
    } catch (e) {
      BF2042Portal.Shared.logError("Failed to save workspace!", e);
    }

    return undefined;
  }

  function getSelectedBlocks(scope) {
    let blocks = undefined;

    if (
      !blocks &&
      (_Blockly.selected || (scope !== undefined && scope.block))
    ) {
      blocks = [_Blockly.selected || scope.block];
    }

    return blocks;
  }

  function savePluginData() {
    let dataToSave = {
      favourites: pluginData.favourites,
      privates: pluginData.privates,
      predefined: [],
    };
    BF2042Portal.Shared.saveToLocalStorage(pluginId, dataToSave);
  }

  const manageSnippetsItem = {
    id: "manageSnippets",
    displayText: "Manage Snippets",
    scopeType: workspaceScope,
    weight: 100,
    preconditionFn: () => "enabled",
    callback: () => {
      let dialogUrl = plugin.getUrl("view/manage.html");
      showDialog(dialogUrl, initManageDialog);
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

  const addPrivateSnippetItem = {
    id: "addPrivateSnippetItem",
    displayText: "Add as Private Snippet",
    scopeType: blockScope,
    weight: 100,
    preconditionFn: () => "enabled",
    callback: (scope) => {
      const errorMessage = "Couldn't get selection as snippet!";
      try {
        const blocks = getSelectedBlocks(scope);
        const xmlText = saveXml(blocks);

        if (!xmlText) {
          alert(errorMessage);
          return;
        }

        let snippetName = "";
        while (snippetName === "") {
          snippetName = prompt("Specifiy the name of the snippet:");
          if (snippetName === "") {
            alert("The name cannot be empty!");
          }
        }
        if (!snippetName) {
          return;
        }

        let privateSnippetId = "privateSnippetItem" + crypto.randomUUID();
        pluginData.privates.push({
          id: privateSnippetId,
          name: snippetName,
          xml: xmlText,
        });
        savePluginData();
        buildInsertSnippetMenu();
      } catch (e) {
        BF2042Portal.Shared.logError(errorMessage, e);
        alert(errorMessage);
      }
    },
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

  const snippetsMenu = plugin.createMenu(
    "snippetsMenu",
    "Snippets",
    workspaceScope
  );
  snippetsMenu.options = ["menus.insertSnippetMenu", "items.manageSnippets"];

  plugin.initializeWorkspace = function () {
    let loadedData = BF2042Portal.Shared.loadFromLocalStorage(pluginId);
    if (loadedData.favourites) {
      pluginData = loadedData;
    }
    fetch(plugin.getUrl("snippets/index.json"))
      .then((response) => {
        response.json().then((data) => {
          logInfo("Retrieved snippets index:\n", data);
          pluginData.predefined = data.items;
          logInfo("added predefined snippets to plugin data.");
          buildInsertSnippetMenu();

          plugin.registerMenu(snippetsMenu);
          plugin.registerMenu(insertSnippetMenu);
          plugin.registerMenu(insertSnippetFavouritesMenu);
          plugin.registerMenu(insertSnippetPrivateMenu);
          plugin.registerItem(emptySnippetItem);
          plugin.registerItem(manageSnippetsItem);
          plugin.registerItem(addPrivateSnippetItem);

          try {
            _Blockly.ContextMenuRegistry.registry.register(snippetsMenu);
            _Blockly.ContextMenuRegistry.registry.register(
              addPrivateSnippetItem
            );
          } catch (error) {
            logError("Couldn't register menu items.", error);
          }
        });
      })
      .catch((reason) => {
        logError("Failed to retrieve snippets index:\n", reason);
      });
  };
})();
