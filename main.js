const { Plugin, TFolder } = require("obsidian");

module.exports = class SwefNoteStateIconsPlugin extends Plugin {

  async onload() {
    console.log("SWEF NOTE STATE ICONS LOADED");

    // ===== I18N =====
    await this.loadI18n();

    // ===== STATES =====
    this.states = {
      // --- Group 1 : Status ---
      "validated":    { icon: "✔",  color: "#000000", labelKey: "state.validated" },
      "refused":      { icon: "❌",  color: "#000000", labelKey: "state.refused" },
      "warning":      { icon: "⚠️",  color: "#000000", labelKey: "state.warning" },
      "in-progress":  { icon: "🚧",  color: "#000000", labelKey: "state.inprogress" },
      "review":       { icon: "👁",  color: "#000000", labelKey: "state.review" },
      "redflag":      { icon: "🚩",  color: "#000000", labelKey: "state.redflag" },

      // --- Group 2 : Books ---
      "bookpiles":    { icon: "📚", color: "#000000", labelKey: "state.bookpiles" },
      "notebook":     { icon: "📔", color: "#000000", labelKey: "state.notebook" },
      "bookred":      { icon: "📕", color: "#000000", labelKey: "state.bookred" },
      "bookorange":   { icon: "📙", color: "#000000", labelKey: "state.bookorange" },
      "bookgreen":    { icon: "📗", color: "#000000", labelKey: "state.bookgreen" },
      "bookblue":     { icon: "📘", color: "#000000", labelKey: "state.bookblue" },

      // --- Group 3 : Squares ---
      "squarered":    { icon: "🟥", color: "#000000", labelKey: "state.squarered" },
      "squareorange": { icon: "🟧", color: "#000000", labelKey: "state.squareorange" },
      "squareyellow": { icon: "🟨", color: "#000000", labelKey: "state.squareyellow" },
      "squaregreen":  { icon: "🟩", color: "#000000", labelKey: "state.squaregreen" },
      "squareblue":   { icon: "🟦", color: "#000000", labelKey: "state.squareblue" },
      "squarepurple": { icon: "🟪", color: "#000000", labelKey: "state.squarepurple" },
      "squareblack":  { icon: "⬛", color: "#000000", labelKey: "state.squareblack" },

	  // --- Group 4 : Species ---
	  "elf":       	  { icon: "🧝", color: "#000000", labelKey: "state.elf" },
	  "djinn":        { icon: "🧞", color: "#000000", labelKey: "state.djinn" },
	  "vampire":      { icon: "🧛", color: "#000000", labelKey: "state.vampire" },
	  "fairy":        { icon: "🧚", color: "#000000", labelKey: "state.fairy" },
	  "magician":     { icon: "🧙", color: "#000000", labelKey: "state.magician" },
	  "zombie":       { icon: "🧟‍♀️", color: "#000000", labelKey: "state.zombie" },
      
	  // --- Group 5 : Misc ---
      "frozen":       { icon: "❄️", color: "#000000", labelKey: "state.frozen" },
      "hot":          { icon: "🔥", color: "#000000", labelKey: "state.hot" },
      "explode":      { icon: "💥", color: "#000000", labelKey: "state.explode" },
      "love":         { icon: "❤️", color: "#000000", labelKey: "state.love" },
      "arrow":        { icon: "🔰", color: "#000000", labelKey: "state.arrow" },
      "medal":        { icon: "🎖️", color: "#000000", labelKey: "state.medal" },
      "light":        { icon: "💡", color: "#000000", labelKey: "state.light" },
      "2swords":      { icon: "⚔️", color: "#000000", labelKey: "state.2swords" },
      "globe":        { icon: "🌐", color: "#000000", labelKey: "state.globe" },
      "sun":          { icon: "🔅", color: "#000000", labelKey: "state.sun" },
      "star":         { icon: "⭐", color: "#000000", labelKey: "state.star" }
    };

    this.stateMap = (await this.loadData()) || {};

    // ===== CONTEXT MENU (NOTES + DOSSIERS) =====
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!file) return;

        const isFolder = file instanceof TFolder;
        const isMarkdown = file.extension === "md";
        if (!isFolder && !isMarkdown) return;

        menu.addItem(item => {
          item.setTitle(this.t("menu.state")).setIcon("tag").setSubmenu();
        });

        const stateMenu = menu.items.at(-1).submenu;

        stateMenu.addItem(sub => {
          sub
            .setTitle(this.t("menu.none"))
            .setIcon("x")
            .onClick(async () => {
              delete this.stateMap[file.path];
              await this.saveData(this.stateMap);
              this.triggerFullRefresh();
            });
        });

        stateMenu.addSeparator();

        const groups = [
          ["validated","refused","warning","in-progress","review","redflag"],
          ["bookpiles","notebook","bookred","bookorange","bookgreen","bookblue"],
          ["squarered","squareorange","squareyellow","squaregreen","squareblue","squarepurple","squareblack"],
		  ["elf","djinn","vampire","fairy","magician","zombie"],
          ["frozen","hot","explode","love","arrow","medal","light","2swords","globe","sun","star"]
        ];

        groups.forEach((group, i) => {
          if (i > 0) stateMenu.addSeparator();

          group.forEach(stateId => {
            const state = this.states[stateId];
            if (!state) return;

            stateMenu.addItem(sub => {
              sub
                .setTitle(`${state.icon} ${this.t(state.labelKey)}`)
                .onClick(async () => {
                  this.stateMap[file.path] = stateId;
                  await this.saveData(this.stateMap);
                  this.triggerFullRefresh();
                });
            });
          });
        });
      })
    );

    // ===== EVENTS =====
    this.registerEvent(this.app.workspace.on("layout-ready", () => this.triggerFullRefresh()));
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.triggerFullRefresh()));

    this.registerEvent(
      this.app.vault.on("rename", async (file, oldPath) => {
        if (this.stateMap[oldPath]) {
          this.stateMap[file.path] = this.stateMap[oldPath];
          delete this.stateMap[oldPath];
          await this.saveData(this.stateMap);
        }
        this.triggerFullRefresh();
      })
    );

    this.registerEvent(
      this.app.vault.on("delete", async (file) => {
        delete this.stateMap[file.path];
        await this.saveData(this.stateMap);
        this.triggerFullRefresh();
      })
    );

    this.triggerFullRefresh();
  }

  // ===== FULL REFRESH =====
  triggerFullRefresh() {
    [0, 300, 800, 1500, 3000].forEach(delay =>
      setTimeout(() => this.refreshFileExplorer(), delay)
    );
  }

  // ===== I18N =====
  async loadI18n() {
    const lang = document.documentElement.lang?.startsWith("fr") ? "fr" : "en";
    const base = `${this.manifest.dir}/i18n/`;

    try {
      const r = await fetch(this.app.vault.adapter.getResourcePath(`${base}${lang}.json`));
      this.i18n = await r.json();
    } catch {
      const r = await fetch(this.app.vault.adapter.getResourcePath(`${base}en.json`));
      this.i18n = await r.json();
    }
  }

  t(key) {
    return this.i18n?.[key] ?? key;
  }

  // ===== FILE EXPLORER RENDER =====
  refreshFileExplorer() {
    const leaves = this.app.workspace.getLeavesOfType("file-explorer");

    leaves.forEach(leaf => {
      const view = leaf.view;
      if (!view?.fileItems) return;

      Object.values(view.fileItems).forEach(item => {
        const file = item.file;
        if (!file) return;

        const stateId = this.stateMap[file.path];
        const state = this.states[stateId];
        if (!state) return;

        const title = item.el?.querySelector(".tree-item-inner");
        if (!title) return;

        title.querySelector(".swef-state-icon")?.remove();

        const icon = document.createElement("span");
        icon.className = "swef-state-icon";
        icon.textContent = state.icon;
        icon.style.marginRight = "6px";
        icon.style.fontWeight = "bold";

        title.prepend(icon);
      });
    });
  }

  onunload() {
    console.log("SWEF NOTE STATE ICONS UNLOADED");
  }
};
