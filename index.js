(function () {
  const plugin = BF2042Portal.Plugins.getPlugin("bf2042-portal-snippet-plugin");

  const displayMessageXML =
    '<block  type="DisplayCustomNotificationMessage" x="122" y="1266"><value name="VALUE-0"><block type="Message"><value name="VALUE-0"><block type="Text"><field name="TEXT">MESSAGE</field></block></value></block></value><value name="VALUE-1"><block type="CustomMessagesItem"><field name="VALUE-0">CustomMessages</field><field name="VALUE-1">HeaderText</field></block></value><value name="VALUE-2"><block type="Number"><field name="NUM">-1</field></block></value></block>';

  plugin.initializeWorkspace = function () {
    //Do nothing
  };

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

  function buildInsertSnippetMenu(){
    try {
      let insertItemCounter = 0;
      let categoryMenus = [];
      fetch(plugin.getUrl("snippets/index.json")).then((response) => {
        logInfo("Retrieved snippets index:\n", response.json());
        let snippetsIndex = response.json();
        snippetsIndex.items.forEach((item) => {
          let menuId = item.category+"InsertMenu";
          let menuName = item.category;
          if(!categoryMenus.some((element) => item.category+"InsertMenu" === element.id)){
            let menu = plugin.createMenu(menuId, menuName, _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE);
            let insertSnippetItem = {
              id: insertItem+"insertItemCounter",
              weight: 100,
              
            }
            menu.options = ["items.insertItem"+insertItemCounter]
            categoryMenus.push(menu)
          }
        })
      }).catch((reason) => {
        logError("Failed to retrieve snippets index:\n", reason);
      })
    } catch (error) {
      logError("Failed to build snippets menu:\n", error);
    }
  }

  const customHeaderMessageItem = {
    id: "customHeaderMessage",
    displayText: "Custom Header Message",
    scopeType: _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
    weight: 100,
    preconditionFn: () => "enabled",
    callback: async function () {
      try {
        loadXml(displayMessageXML);
      } catch (e) {
        BF2042Portal.Shared.logError("Failed to load workspace!", e);
      }
    },
  };

  const manageSnippetsItem = {
    id: "manageSnippets",
    displayText: "Manage Snippets",
    scopeType: _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
    weight: 100,
    preconditionFn: () => "enabled",
    callback: () => {alert("Dialog to manage snippets!")}
  };

  const insertSnippetMessageMenu = plugin.createMenu(
    "insertSnippetMessageMenu",
    "Message",
    _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE
  );
  insertSnippetMessageMenu.options = [
    "items.customHeaderMessage"
  ];
  const insertSnippetVectorMenu = plugin.createMenu(
    "insertSnippetVectorMenu",
    "Vector",
    _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE
  );
  insertSnippetVectorMenu.options = [
    "items.customHeaderMessage"
  ];
  const insertSnippetFavouritesMenu = plugin.createMenu(
    "insertSnippetFavouritesMenu",
    "Favourites",
    _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE
  );
  insertSnippetFavouritesMenu.options = [
    "items.customHeaderMessage"
  ];
  const insertSnippetTemporaryMenu = plugin.createMenu(
    "insertSnippetTemporaryMenu",
    "Temporary",
    _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE
  );
  insertSnippetTemporaryMenu.options = [
    "items.customHeaderMessage"
  ];


  const insertSnippetMenu = plugin.createMenu(
    "insertSnippetMenu",
    "Insert Snippet",
    _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE
  );
  insertSnippetMenu.options = [
    "menus.insertSnippetFavouritesMenu",
    "menus.insertSnippetTemporaryMenu",
    "items.separatorWorkspace",
    "menus.insertSnippetMessageMenu",
    "menus.insertSnippetVectorMenu"
  ];

  const snippetsMenu = plugin.createMenu(
    "snippetsMenu",
    "Snippets",
    _Blockly.ContextMenuRegistry.ScopeType.WORKSPACE
  );
  snippetsMenu.options = [
    "menus.insertSnippetMenu",
    "items.manageSnippets"
  ];

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
