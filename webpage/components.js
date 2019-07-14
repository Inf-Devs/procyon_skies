/**
	DOM Tabbed Panel 
	Use .addTab(tab, name) in order to add a tab 
	
 */
function TabbedPanel()
{
	this.panel = document.createElement("div");
	this.panel.classList.add("tabbedPanel");
	
	this.navigationBar = document.createElement("div");
	this.navigationBar.classList.add("tabbedPanel_navigationBar");
	this.panel.appendChild(this.navigationBar);
	
	this.contentPanel = document.createElement("div");
	this.contentPanel.classList.add("tabbedPanel_contentPanel");
	this.panel.appendChild(this.contentPanel);
	
	this.buttons = [];
	this.tabs = [];
}

TabbedPanel.prototype.navigationButtonPadding = "15px";
TabbedPanel.prototype.navigationButtonBorderWidth = "1px";
TabbedPanel.prototype.addTab = function(tab, name)
{
	this.tabs.push(tab);
	
	var tabButton = document.createElement("div");
	tabButton.innerHTML = name;
	tabButton.classList.add("tabbedPanel_navigationButton");
	tabButton.onclick = () =>
		{
			this.hideAllTabs();
			tab.style.display = "block";
			// that inside page effect
			tabButton.style.borderBottomWidth = "0px";
		}
	this.navigationBar.appendChild(tabButton);
	this.buttons.push(tabButton);
	
	this.contentPanel.appendChild(tab);
	
	// set as the first init in order to set the border
	tabButton.onclick();
}

TabbedPanel.prototype.hideAllTabs = function()
{
	this.tabs.forEach(tab => 
		{
			tab.style.display = "none";
		}
	);
	// that inside page effect
	this.buttons.forEach(button =>
		{
			button.style.borderBottomWidth = "1px";
		}
	);
}
