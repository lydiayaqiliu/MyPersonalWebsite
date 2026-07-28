(function () {
  var tabButtons = document.querySelectorAll(".tab-btn");
  var panels = document.querySelectorAll(".tab-panel");

  function activate(tabId) {
    tabButtons.forEach(function (btn) {
      var isActive = btn.dataset.tab === tabId;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    panels.forEach(function (panel) {
      panel.classList.toggle("active", panel.id === tabId);
    });
  }

  tabButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tabId = btn.dataset.tab;
      activate(tabId);
      history.replaceState(null, "", "#" + tabId);
    });
  });

  var initial = window.location.hash.replace("#", "");
  if (initial && document.getElementById(initial)) {
    activate(initial);
  }
})();
