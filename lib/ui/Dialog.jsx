// UI Component: Dialog Window
// Single responsibility: Create and manage dialog windows
function createDialog(title, properties) {
    properties = properties || {};

    var dialog = new Window("dialog", title || "Text Editor");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    dialog.spacing = 10;
    dialog.margins = 16;

    if (properties.width) dialog.preferredSize.width = properties.width;
    if (properties.height) dialog.preferredSize.height = properties.height;

    return {
        window: dialog,
        addGroup: function(orientation) {
            var group = dialog.add("group");
            group.orientation = orientation || "row";
            group.alignChildren = "left";
            return group;
        },
        addText: function(text) {
            return dialog.add("statictext", undefined, text);
        },
        show: function() {
            dialog.show();
        },
        close: function() {
            dialog.close();
        },
        center: function() {
            dialog.center();
        }
    };
}