var BrightVerify = BrightVerify || {};


BrightVerify.log = function() {
    var debug = true;
    if (debug) console.log.apply(this,arguments);
};

BrightVerify.init = function() {

    // BrightVerify.log("Init");

    var fields = BrightVerify.fields;

    // Set up each field
    $.each(BrightVerify.fields,function(field_name,options){

        // Remove any fields not on this page (e.g. multi-section surveys)
        var input = $('input[name="' + field_name + '"]');
        if (input.length === 0) {
            delete BrightVerify.fields[field_name];
            return;
        }

        // Add class for styling
        input.addClass('brightverify');

        // Add show shortcut pointers
        options.input = input;
        options.overlay = BrightVerify.addStatus(field_name);
        input.data('bv_options', options);

        // Handle changes from verified values
        input.bind('keyup',function(e) {
            var input = $(this);
            var options = input.data('bv_options');
            var field_name = input.attr('name');
            var lbv = input.data('last_brightverify_value');
            // BrightVerify.log(lbv);
            if (lbv && lbv !== input.val() && options.overlay.is(':visible')) {
                // A last value was defined - if it is not longer valid, then we need to clear the input
                BrightVerify.hideOverlay(field_name);
                input.data('last_brightverify_value',null);
                BrightVerify.changeStatus(field_name, "unknown","");
            }
        });
    });

    // Bind all close button clicks
    $('form').on("click", ".bv_close", function(event) {
        var field_name = $(this).data('field_name');
        BrightVerify.hideOverlay(field_name);
    });

    // Bind resize events to keep overlay positioned correctly
    $( window ).resize(function() {
        BrightVerify.resize()
    });
};


BrightVerify.addStatus = function(field_name) {
    // Bind to the input field
    var input = $('input[name="' + field_name + '"]');

    var bv_logo = $('<div/>').addClass('bv_logo');

    var bv_status = $('<div/>').addClass('bv_status');

    var bv_close = $('<div/>')
        .data('field_name', field_name)
        .addClass('bv_close')
        .text("x");

    var bv_tip = $('<div/>')
        .addClass('bv_tip')
        .attr('title','Email verification powered by BrightVerify')
        .append(bv_logo)
        .append(bv_status)
        .append(bv_close);

    var bv_overlay = $('<div/>')
        .addClass('bv_overlay')
        .append(bv_tip)
        .insertAfter(input);

    return bv_overlay;
};

BrightVerify.resize = function() {
    $.each(BrightVerify.fields, function(field_name, options) {
        var input = options.input;
        var overlay = options.overlay;

        var ipos    = input.offset();
        var iwidth  = input.width()+12;
        var itop    = ipos.top;
        var ileft   = ipos.left;

        var tipWidth = $('.bv_tip',overlay).width();
        var tipLeft  = $('.bv_tip',overlay).position().left;
        var gap      = iwidth - tipWidth;  // How much larger is the input than the overlay
        var minGap = 150;
        var oWidth = overlay.width();
        var oLeft  = overlay.position().left;

        // if (field_name == 'email2') BrightVerify.log(' ' + field_name, "l:" + ileft, "w:" + iwidth);
        // if (field_name == 'email2') BrightVerify.log('    tip', "l:" + tipLeft, "w:" + tipWidth, "g:" + gap);
        // if (field_name == 'email2') BrightVerify.log('overlay', "l:" + oLeft, "w:" + oWidth);

        // if (gap < minGap) ileft=ileft+minGap;
        overlay.css({top: itop, left: ileft, width: iwidth});
    });
};

// Valid status are error, success, verifying, unknown
BrightVerify.changeStatus = function(field_name, status, message) {

    // Create the overlay if it doesn't exist
    BrightVerify.log("Change status of " + field_name + " to " + status + " with message: " + message);

    if (BrightVerify.fields[field_name] === undefined) {
        BrightVerify.log(field_name + " is NOT a BV Field!");
        return false;
    }

    // if (BrightVerify.fields[field_name]['bv_overlay'] === undefined) BrightVerify.addStatus(field_name);
    var options = BrightVerify.fields[field_name];
    var overlay = options['overlay'];
    var bv_tip = $('.bv_tip', overlay);

    var tipWidth = bv_tip.width();

    var bv_status = $('.bv_status', overlay);
    var input = options['input'];
    options.status = status;

    switch (status) {
        case "error":
            bv_tip
                .removeClass('-success')
                .removeClass('-verifying')
                .addClass('-error');
            input
                .removeClass('-success')
                .removeClass('-verifying')
                .addClass('-error');
            bv_status.text(message);
            break;
        case "success":
            bv_tip
                .removeClass('-error')
                .removeClass('-verifying')
                .addClass('-success');
            input
                .removeClass('-error')
                .removeClass('-verifying')
                .addClass('-success');
            bv_status.text(message);
            break;
        case "verifying":
            bv_tip
                .removeClass('-success')
                .removeClass('-error')
                .addClass('-verifying');
            input
                .removeClass('-success')
                .removeClass('-error')
                .addClass('-verifying');
            bv_status.text(message);
            break;
        case "unknown":
            bv_tip
                .removeClass('-success')
                .removeClass('-error')
                .removeClass('-verifying');
            input
                .removeClass('-success')
                .removeClass('-error')
                .removeClass('-verifying');
            bv_status.text(message);
            break;
    }

    var new_bv_tip = bv_tip.clone().css({"width":"auto"}).appendTo("body");
    var newWidth = new_bv_tip.width() + 10;
    new_bv_tip.remove();
    // BrightVerify.log('newWidth',newWidth);

    BrightVerify.updateSubmit();
    // BrightVerify.resize();
    bv_tip.animate({"width":newWidth}, 500, BrightVerify.resize);
};

BrightVerify.hideOverlay = function(field_name) {
    BrightVerify.fields[field_name]['overlay'].fadeOut();
};

BrightVerify.showOverlay = function(field_name) {
    BrightVerify.fields[field_name]['overlay'].fadeIn();
    BrightVerify.resize();
};

BrightVerify.updateSubmit = function() {

    $('button[name^="submit-btn-save"]').attr('disabled','disabled').addClass('bv_disabled');

    // Assume we can submit
    var submitDisabled = false;

    // Go through and see if any have a status of error or verifying
    $.each(BrightVerify.fields,function(field,options) {
        // BrightVerify.log('updateSubmit', field, options);
        var status = options['status'];
        var hardValidation = options['hard-validation'];
        if (status == "error" || status == "verifying") {
            // Make sure hard-validation is enabled
            if (hardValidation) {
                submitDisabled = true;
            }
        }
    });

    if (submitDisabled) {
        // Verify that submit buttons are disabled
        $('button[name^="submit-btn-save"], #submit-btn-dropdown').not('.bv_disabled').each(function(i,e) {
            // BrightVerify.log(i,e);
            $(e).attr('disabled', 'disabled')
                .addClass('bv_disabled')
                .data('orig_title', $(e).attr('title') || '')
                .prop('title', 'Please fix any email validation issues before saving');
        });
    } else {
        // Undo any disabled submit buttons
        $('button[name^="submit-btn-save"].bv_disabled, #submit-btn-dropdown.bv_disabled').each(function(i,e) {
            // BrightVerify.log("Orig Title", $(e).data('orig_title'));
            $(e).removeAttr('disabled')
                .removeClass('bv_disabled')
                .attr('title', $(e).data('orig_title'));
        });
    }
    //    "submit-btn-saverecord, submit-btn-savecontinue, submit-btn-savenextform, submit-btn-savecompresp, submit-btn-saveexitrecord, submit-btn-savenextrecord";
    //    "submit-btn-cancel"
};

BrightVerify.validate = function(args) {

    // BrightVerify.log("validate args", args);
    field = args[0];


    field_name = $(field).prop('name');
    BrightVerify.log("validating field_name " + field_name);

    if (BrightVerify.fields[field_name]) {

        BrightVerify.log(field_name + " uses BrightVerify");

        if ($(field).val().length) {

            // Do a bright verify
            email = $(field).val();
            last_brightverify_value = $(field).data('last_brightverify_value');

            if (email === last_brightverify_value) {
                // No need to re-verify
                BrightVerify.log("No change in value - skip");
                BrightVerify.showOverlay(field_name);
                return false;
            }
            // BrightVerify.log("Will Validate " + field_name + "'s value: " + email);

            BrightVerify.changeStatus(field_name, "verifying", "Verifying...");
            BrightVerify.showOverlay(field_name);
            BrightVerify.updateSubmit();

            $.post(BrightVerify.url, {
                "email":    email,
                "record":   BrightVerify.record,
                "event_id": BrightVerify.event_id,
                "field":    field_name
            })
                .done(function (field_name,email) {
                    return function(data) {
                        data = JSON.parse(data);
                        // var field = field_name;
                        var success = data.success;
                        var message = data.message;

                        console.log("Success: " , success, "Message" , message, data, field_name, email);
                        BrightVerify.log("Post done with field ", field_name, "and data", data);

                        var result = success ? "success" : "error";
                        BrightVerify.changeStatus(field_name, result, message);

                        // if (success) {
                        //     console.log ("Success true");
                        //     // success
                        //     BrightVerify.changeStatus(field_name, "success", message);
                        // } else {
                        //     console.log ("Success false");
                        //     BrightVerify.changeStatus(field_name, "error", message);
                        //     // BrightVerify.fields[field_name].status = "error";
                        //     // BrightVerify.fields[field_name].statusMsg = "Invalid Email";
                        // };

                        // Cache last value verified
                        var input = $('input[name="'+field_name+'"]');
                        input.data('last_brightverify_value', email);
                        BrightVerify.log ("Caching " + email);

                        BrightVerify.showOverlay(field_name);
                        // BrightVerify.updateSubmit();
                    }
                }(field_name,email))
                .fail(function () {
                    BrightVerify.log("ERROR with ajax post!");
                    BrightVerify.changeStatus(field_name, "error", "Error In Service");
                })
                .always(function () {
                    // BrightVerify.log("Always");
                });
        } else {
            // Empty - let's clear any BV validation
            BrightVerify.hideOverlay(field_name);
            BrightVerify.changeStatus(field_name, "unknown", "");
            // BrightVerify.updateSubmit();
        }
    } else {
        // BrightVerify.log('do nothing');
    }
    // Fix annoying behavior with checkEnumRawVal
    // Forces validation after auto-correct (but would like to update auto-correct function going forward)

};


$(document).ready(function() {
    BrightVerify.init();

    // Override the normal validation function - so use REDCap to validate basic format, then BrightVerify to make
    // sure it is a real email address...
    (function () {
        var proxied = redcap_validate;
        redcap_validate = function () {
            result = proxied.apply(this, arguments);
            BrightVerify.log("redcap_valud result: ",result); //BrightVerify.validate(this);
            if (result) {
                // field passed redcap validation
                BrightVerify.validate(arguments);
            }
            return result;
        };
    })();

    // (function () {
    //     var proxied = dataEntrySubmit;
    //     dataEntrySubmit = function () {
    //         var ob = arguments[0];
    //         BrightVerify.log('ob',ob);
    //         var action = '';
    //         if (typeof ob === 'string' || ob instanceof String) {
    //             action = ob;
    //         } else {
    //             action = $(ob).attr('name');
    //         }
    //         if ( action == '' || action == null ) action = 'submit-btn-saverecord';
    //         if ( action !== "submit-btn-cancel" ) {
    //             // Do Bright Verify Check
    //             // Verify there are no BrightVerify errors
    //             var errorCount = BrightVerify.pageErrors();
    //             BrightVerify.log("Error Count", errorCount);
    //             if (errorCount) {
    //                 var msg = "Unable to Submit:" + BrightVerify.pageErrorMessage.toString();
    //                 alert (msg);
    //                 return false;
    //             } else {
    //                 // Success
    //             }
    //         } else {
    //             // Do nothing
    //         }
    //
    //         // Do the normal dataEntrySubmit function
    //         return proxied.apply(this, arguments);
    //     };
    // })();

});