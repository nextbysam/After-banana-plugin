// Timeline Utilities: Layer Management
// Single responsibility: Handle After Effects layer operations
function createLayerUtils() {

    return {
        // Get active composition
        getActiveComp: function() {
            return app.project.activeItem;
        },

        // Get selected layers
        getSelectedLayers: function() {
            var comp = this.getActiveComp();
            if (!comp || !(comp instanceof CompItem)) {
                return [];
            }
            return comp.selectedLayers;
        },

        // Create text layer
        createTextLayer: function(text, comp) {
            comp = comp || this.getActiveComp();
            if (!comp || !(comp instanceof CompItem)) {
                throw new Error("No active composition");
            }

            var textLayer = comp.layers.addText(text);
            return textLayer;
        },

        // Add property keyframe
        addKeyframe: function(property, time, value) {
            if (!property || !property.canVaryOverTime) {
                return false;
            }

            var keyIndex = property.addKey(time);
            property.setValueAtKey(keyIndex, value);
            return keyIndex;
        },

        // Get layer properties
        getLayerProperties: function(layer) {
            return {
                name: layer.name,
                index: layer.index,
                startTime: layer.startTime,
                inPoint: layer.inPoint,
                outPoint: layer.outPoint,
                position: layer.transform.position.value,
                scale: layer.transform.scale.value,
                rotation: layer.transform.rotation.value,
                opacity: layer.transform.opacity.value
            };
        },

        // Animate layer property
        animateProperty: function(layer, propertyName, keyframes) {
            var prop = layer.transform[propertyName];
            if (!prop) return false;

            for (var i = 0; i < keyframes.length; i++) {
                this.addKeyframe(prop, keyframes[i].time, keyframes[i].value);
            }
            return true;
        }
    };
}