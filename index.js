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

  function showEditDialog(editId) {
    showDialog(plugin.getUrl("view/edit.html"), () => {
      initEditDialog(editId);
    });
  }

  function initEditDialog(editId) {
    document
      .getElementById("dialogClose")
      .addEventListener("click", showManageDialog);
    document
      .getElementById("dialogButtonCancel")
      .addEventListener("click", showManageDialog);
    document
      .getElementById("dialogBackdrop")
      .addEventListener("click", () => {});

    let editItem = pluginData.privates.find(({ id }) => id === editId);

    if (editItem) {
      document.getElementById("snippetName").value = editItem.name;
      document.getElementById("snippetContent").value = editItem.xml;
      document
        .getElementById("dialogButtonOk")
        .addEventListener("click", () => {
          let validationItem = {
            id: editItem.id,
            name: "",
            xml: "",
          };
          validationItem.name = document.getElementById("snippetName").value;
          validationItem.xml = document.getElementById("snippetContent").value;
          if (validateEditPrivateSnippet(validationItem).length == 0) {
            editItem.name = validationItem.name;
            editItem.xml = validationItem.xml;
            savePluginData();
            buildInsertSnippetMenu();
            showManageDialog();
          } else {
            alert(issues);
          }
        });
    } else {
      editItem = {
        id: "privateSnippetItem" + crypto.randomUUID(),
        name: "",
        xml: "",
      };
      document
        .getElementById("dialogButtonOk")
        .addEventListener("click", () => {
          editItem.name = document.getElementById("snippetName").value;
          editItem.xml = document.getElementById("snippetContent").value;
          if (validateNewPrivateSnippet(editItem).length == 0) {
            pluginData.privates.push(editItem);
            savePluginData();
            buildInsertSnippetMenu();
            showManageDialog();
          } else {
            alert(issues);
          }
        });
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

  function removePrivate(itemId) {
    let favIndex = pluginData.favourites.indexOf(itemId);
    if (favIndex > -1) {
      pluginData.favourites.splice(favIndex, 1);
    }
    let privItem = pluginData.privates.find(({ id }) => id === itemId);
    let privIndex = pluginData.privates.indexOf(privItem);
    if (privIndex > -1) {
      pluginData.privates.splice(privIndex, 1);
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

    let editIcon = document.getElementById("snippetEditIcon");
    let infoIcon = document.getElementById("snippetInfoIcon");
    let addIcon = document.getElementById("snippetAddIcon");
    let insertIcon = document.getElementById("snippetInsertIcon");
    let favouriteIcon = document.getElementById("snippetFavouriteIcon");
    let removeIcon = document.getElementById("snippetRemoveIcon");

    let favList = document.getElementById("favList");
    let favListLabel = document.getElementById("favouritesLabel");
    favListLabel.addEventListener("click", (e) => {
      if (e.target === favListLabel) {
        favListLabel.classList.toggle("listLabelExpanded");
        favListLabel.classList.toggle("listLabelCollapsed");
        favList.classList.toggle("hiddenList");
      }
    });
    favList.innerHTML = "";
    pluginData.favourites.forEach((item) => {
      let favData = pluginData.privates.find(({ id }) => id === item);
      if (!favData) {
        favData = pluginData.predefined.find(({ id }) => id === item);
      }
      if (favData) {
        let favItem = document.createElement("li");
        let itemText = document.createElement("span");
        itemText.innerText = favData.name;
        itemText.style.paddingRight = "5px";
        favItem.appendChild(itemText);
        let itemLink = document.createElement("a");
        itemLink.appendChild(removeIcon.cloneNode(true));
        itemLink.addEventListener("click", () => {
          removeFavorite(favData.id);
          initManageDialog();
        });
        favItem.appendChild(itemLink);

        itemLink = document.createElement("a");
        itemLink.appendChild(insertIcon.cloneNode(true));
        itemLink.addEventListener("click", () => {
          if(favData.hasOwnProperty("url")){
            insertSnippetFromUrl(plugin.getUrl(favData.url));
          }else if(favData.hasOwnProperty("xml")){
            insertSnippetFromText(favData.xml)
          }else{
            alert("Cannot insert data from unknown item type.");
          }
        });
        favItem.appendChild(itemLink);

        favList.appendChild(favItem);
      }
    });
    if (pluginData.favourites.length == 0) {
      let favItem = document.createElement("li");
      let itemText = document.createElement("span");
      itemText.innerText = "empty";
      itemText.style.paddingRight = "5px";
      favItem.appendChild(itemText);
      favList.appendChild(favItem);
    }

    let privList = document.getElementById("privList");
    let privListLabel = document.getElementById("privateLabel");
    privListLabel.addEventListener("click", (e) => {
      if (e.target === privListLabel) {
        privListLabel.classList.toggle("listLabelExpanded");
        privListLabel.classList.toggle("listLabelCollapsed");
        privList.classList.toggle("hiddenList");
      }
    });
    privList.innerHTML = "";
    let addPrivLink = document.createElement("a");
    addPrivLink.innerText = "[Add New]";
    addPrivLink.addEventListener("click", showEditDialog);
    let addPrivItem = document.createElement("li");
    addPrivItem.appendChild(addPrivLink);
    privList.appendChild(addPrivItem);
    pluginData.privates.forEach((item) => {
      let privItem = document.createElement("li");
      let itemText = document.createElement("span");
      itemText.innerText = item.name;
      itemText.style.paddingRight = "5px";
      privItem.appendChild(itemText);

      let itemLink = document.createElement("a");
      itemLink.appendChild(editIcon.cloneNode(true));
      itemLink.addEventListener("click", () => {
        showEditDialog(item.id);
      });
      privItem.appendChild(itemLink);

      itemLink = document.createElement("a");
      itemLink.appendChild(favouriteIcon.cloneNode(true));
      itemLink.addEventListener("click", () => {
        addFavorite(item.id);
        initManageDialog();
      });
      privItem.appendChild(itemLink);

      itemLink = document.createElement("a");
      itemLink.appendChild(removeIcon.cloneNode(true));
      itemLink.addEventListener("click", () => {
        if (
          confirm(
            "Do you really want to delete your private snippet '" +
              item.name +
              "'?"
          )
        ) {
          removePrivate(item.id);
          initManageDialog();
        }
      });
      privItem.appendChild(itemLink);

      itemLink = document.createElement("a");
      itemLink.appendChild(insertIcon.cloneNode(true));
      itemLink.addEventListener("click", () => {
        insertSnippetFromText(item.xml);
      });
      privItem.appendChild(itemLink);

      privList.appendChild(privItem);
    });

    let snippetList = document.getElementById("snippetList");
    snippetList.innerHTML = "";
    pluginData.predefined.forEach((item) => {
      let predCatList = document.getElementById(
        "predefined-snippet-" + item.category + "-list"
      );
      if (!predCatList) {
        predCatList = document.createElement("ul");
        predCatList.id = "predefined-snippet-" + item.category + "-list";
        predCatList.classList.toggle("hiddenList");
        let catItem = document.createElement("li");
        catItem.classList.toggle("listLabel");
        catItem.classList.toggle("listLabelCollapsed");
        catItem.innerText = item.category;
        catItem.addEventListener("click", (e) => {
          if (e.target === catItem) {
            catItem.classList.toggle("listLabelExpanded");
            catItem.classList.toggle("listLabelCollapsed");
            predCatList.classList.toggle("hiddenList");
          }
        });
        catItem.appendChild(predCatList);
        snippetList.appendChild(catItem);
      }
      let predItem = document.createElement("li");
      let itemText = document.createElement("span");
      itemText.innerText = item.name;
      itemText.style.paddingRight = "5px";
      predItem.appendChild(itemText);

      let itemLink = document.createElement("a");
      itemLink.appendChild(favouriteIcon.cloneNode(true));
      itemLink.addEventListener("click", () => {
        addFavorite(item.id);
        initManageDialog();
      });
      predItem.appendChild(itemLink);

      itemLink = document.createElement("a");
      itemLink.appendChild(infoIcon.cloneNode(true));
      itemLink.addEventListener("click", (e) => {
        alert(item.description);
      });
      predItem.appendChild(itemLink);

      itemLink = document.createElement("a");
      itemLink.appendChild(insertIcon.cloneNode(true));
      itemLink.addEventListener("click", (e) => {
        insertSnippetFromUrl(plugin.getUrl(item.url));
      });
      predItem.appendChild(itemLink);

      predCatList.appendChild(predItem);
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
                let existingBackdrop = document.getElementById(
                  "dialogBackdrop"
                );
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
      let predefinedCategoryMenus = [];
      insertSnippetMenu.options = [];
      insertSnippetMenu.options = [
        "menus.insertSnippetFavouritesMenu",
        "menus.insertSnippetPrivateMenu",
        "items.separatorWorkspace",
      ];
      logInfo("Creating Snippets Menu...");
      insertSnippetPrivateMenu.options = ["items.emptySnippetItem"];
      insertSnippetFavouritesMenu.options = ["items.emptySnippetItem"];
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
        insertSnippetPrivateMenu.options.push("items." + item.id);

        if (pluginData.favourites.indexOf(item.id) > -1) {
          if (
            insertSnippetFavouritesMenu.options.length == 1 &&
            insertSnippetFavouritesMenu.options[0] == "items.emptySnippetItem"
          ) {
            insertSnippetFavouritesMenu.options.pop();
          }
          insertSnippetFavouritesMenu.options.push("items." + item.id);
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

          if (pluginData.favourites.indexOf(item.id) > -1) {
            if (
              insertSnippetFavouritesMenu.options.length == 1 &&
              insertSnippetFavouritesMenu.options[0] == "items.emptySnippetItem"
            ) {
              insertSnippetFavouritesMenu.options.pop();
            }
            insertSnippetFavouritesMenu.options.push("items." + item.id);
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

  function validateEditPrivateSnippet(snippetItem) {
    issues = [];
    if (snippetItem) {
      if (
        snippetItem.hasOwnProperty("id") &&
        snippetItem.hasOwnProperty("name") &&
        snippetItem.hasOwnProperty("xml")
      ) {
        if (snippetItem.name != "") {
          if (
            pluginData.privates.find(({ id }) => id === snippetItem.id) !=
            undefined
          ) {
            if (
              !pluginData.predefined.some(
                ({ name }) => name === snippetItem.name
              )
            ) {
              if (snippetItem.xml != "") {
                try {
                  if (!snippetItem.xml.startsWith("<block")) {
                    throw new Error("Snippet must start with a block element!");
                  }
                  const domText = `<xml xmlns="https://developers.google.com/blockly/xml">${snippetItem.xml.trim()}</xml>`;
                  const xmlDom = _Blockly.Xml.textToDom(domText);
                } catch (error) {
                  issues.push(error);
                }
              } else {
                issues.push("Snippet content doesn't appear to be proper XML");
              }
            } else {
              issues.push("Snippet Name is already taken");
            }
          }
        } else {
          issues.push("Snippet Name must not be empty");
        }
      } else {
        issues.push("A Snippet attribute is missing");
      }
    } else {
      issues.push("Snippet is NULL");
    }
    return issues;
  }

  function validateNewPrivateSnippet(snippetItem) {
    issues = [];
    if (snippetItem) {
      if (
        snippetItem.hasOwnProperty("id") &&
        snippetItem.hasOwnProperty("name") &&
        snippetItem.hasOwnProperty("xml")
      ) {
        if (snippetItem.name != "") {
          if (
            !pluginData.privates.some(
              ({ name }) => name === snippetItem.name
            ) &&
            !pluginData.predefined.some(({ name }) => name === snippetItem.name)
          ) {
            if (
              !pluginData.privates.some(({ id }) => id === snippetItem.id) &&
              !pluginData.predefined.some(({ id }) => id === snippetItem.id)
            ) {
              if (snippetItem.xml != "") {
                try {
                  if (!snippetItem.xml.startsWith("<block")) {
                    throw new Error("Snippet must start with a block element!");
                  }
                  const domText = `<xml xmlns="https://developers.google.com/blockly/xml">${snippetItem.xml.trim()}</xml>`;
                  const xmlDom = _Blockly.Xml.textToDom(domText);
                } catch (error) {
                  issues.push(error);
                }
              } else {
                issues.push("Snippet content doesn't appear to be proper XML");
              }
            } else {
              issues.push("Snippet ID seems to be already taken");
            }
          } else {
            issues.push("Snippet Name is already taken");
          }
        } else {
          issues.push("Snippet Name must not be empty");
        }
      } else {
        issues.push("A Snippet attribute is missing");
      }
    } else {
      issues.push("Snippet is NULL");
    }
    return issues;
  }

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

          plugin.registerMenu(insertSnippetMenu);
          plugin.registerMenu(insertSnippetFavouritesMenu);
          plugin.registerMenu(insertSnippetPrivateMenu);
          plugin.registerItem(emptySnippetItem);
          plugin.registerItem(manageSnippetsItem);

          try {
            _Blockly.ContextMenuRegistry.registry.register(insertSnippetMenu);
            _Blockly.ContextMenuRegistry.registry.register(manageSnippetsItem);
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
