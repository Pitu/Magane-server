window.onload = function() {
	plyr.setup();

	var activeTab;
	var closeButtons = document.querySelectorAll('.btnModal');
	for (var button of closeButtons) {
		button.addEventListener('click', function() {
			document.querySelector('#downloadModal').classList.toggle('active');
			setActiveTab(0);
		});
	}

	var tabs = document.querySelectorAll('.tab > li');
	var tabLinks = document.querySelectorAll('.tab > li > a');
	var tabContent = document.querySelectorAll('.tabContent > .content');

	for (var i = 0; i < tabs.length; i++) {
		tabs[i].addEventListener('click', setActiveTab.bind(this, i), false);
	}

	function setActiveTab(number) {
		if (activeTab === number) return;
		activeTab = number;
		for (var i = 0; i < tabs.length; i++) {
			if (i === number) {
				tabs[i].classList.add('active');
				tabLinks[i].classList.add('active');
				tabContent[i].classList.add('active');
			} else {
				tabs[i].classList.remove('active');
				tabLinks[i].classList.remove('active');
				tabContent[i].classList.remove('active');
			}
		}
	}
};
