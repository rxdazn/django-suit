/**
 * Determines if a form is dirty by comparing the current value of each element
 * with its default value.
 *
 * @param {Form} form the form to be checked.
 * @return {Boolean} <code>true</code> if the form is dirty, <code>false</code>
 *                   otherwise.
 *
 * Taken from here: http://stackoverflow.com/a/155812/641263
 */

var confirmExitIfModified = (function () {

    // combines all of the values of an object that has properties values as arrays
    // e.g
    // var template_regions = {
    //    'base': ['main', 'sidebar'],
    //    '2col': ['col1', 'col2']
    // };
    // --> ['main', 'sidebar', 'col1', 'col2', 'sidebar']
    var mergeObjectKeys = function(obj) {
        var values = [];
        for (var key in obj) {
            values = values.concat(obj[key]);
        }
        return values;
    };

    var templateRegions = null;
    var feincmsActive = false;
    
    // FeinCMS defined global variables defined in
    // feincms/feincms/templates/admin/feincms/_regions_js.html
    if (typeof REGION_MAP !== 'undefined' && typeof CONTENT_NAMES != 'undefined' &&
        typeof template_regions !== 'undefined') {
        feincmsActive = true;
        var templateRegions = mergeObjectKeys(template_regions);
    }

    function formIsDirty(form) {
        for (var i = 0; i < form.elements.length; i++) {
            var element = form.elements[i];
            var type = element.type;
            if (type == "checkbox" || type == "radio") {
                if (element.checked != element.defaultChecked) {
                    return true;
                }
            }
            else if (type == "hidden" || type == "password" ||
                type == "text" || type == "textarea") {
                var cls = element.getAttribute('class');
                if (element.value != element.defaultValue &&
                    // Fix for select2 multiple
                    cls.indexOf('select2') == -1 &&
                    // Skip elements with ignore-changes class
                    cls.indexOf('ignore-changes') == -1
                    ) {
                    return true;
                }
            }
            else if (type == "select-one" || type == "select-multiple") {
                // fix to prevent 'you have unsaved changes' dialog from
                // incorrectly displaying when FeinCMS is active 
                //
                // below, element.options[j].selected !=  element.options[j].defaultSelected
                // for select values in:
                // * 'add new item' (new ContentType)
                // * 'insert new [ContentType]' (controls under existing region ContentType blocks)
                // * 'move to [Region]' (controls under existing region ContentType blocks)
                // this is what incorrectly triggers the dialog
                // we are simply ignoring them
                for (var j = 0; j < element.options.length; j++) {
                    if (element.options[j].selected !=
                        element.options[j].defaultSelected) {
                        if (feincmsActive) {
                            var optionValue = $(element.options[j]).attr('value');
                            if (optionValue in CONTENT_NAMES
                                || templateRegions.indexOf(optionValue) > -1) {
                                continue;
                            } else {
                                return true;
                            }
                        } else {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    var submit = false;
    return function (form_id, message) {
        var form = document.forms[form_id]
        if (form) {
            form.onsubmit = function (e) {
                e = e || window.event;
                submit = true
            };
        }
        window.onbeforeunload = function (e) {
            e = e || window.event;
            if (!submit && formIsDirty(form)) {
                // For IE and Firefox
                if (e) {
                    e.returnValue = message;
                }
                // For Safari
                return message;
            }
        };
    };
})();
