$(function() {
	$("form").attr("novalidate", "novalidate");
    $.fn.is_valid = (function() {
		let input_parent = ".form-group, [class^='col-']";
        $(this).addClass("was-validated");
        $(this).find(".invalid-feedback").remove();
        $(this).find(".is-invalid").removeClass("is-invalid");
        $(this).find(input_parent).removeClass("has-danger");
        var errorFlag = false;
        // RegEx Variables
        nam     = /^[a-zA-Z ]+$/;
        tel     = /^\d+$/;
        mob     = /^[0-9]{10}$/;
        email   = /^([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
        stpas   = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
        $(this).find("input.mobile").each(function() {
            if( !mob.test( $(this).val() ) ) {
                $(this).addClass("is-invalid");
                $(this).closest(input_parent).append('<div class="invalid-feedback">Please enter only 10 digit numeric value.</div>');
                errorFlag = true;
            }
        });
        $(this).find("input.name").each(function() {
            if( !nam.test( $(this).val() ) ) {
                $(this).addClass("is-invalid");
                $(this).closest(input_parent).append('<div class="invalid-feedback">Please don\'t include any special characters or numeric value.</div>');
                errorFlag = true;
            }
        });
        $(this).find("input, select, textarea").each(function() {
            if($(this).prop("required") && $(this).val() == "") {
                $(this).addClass("is-invalid");
                $(this).closest(input_parent).append('<div class="invalid-feedback">Please fill required field.</div>');
                errorFlag = true;
            }
            if($(this).attr("type") == "tel" && !tel.test($(this).val()) && !$(this).hasClass("mobile")) {
                $(this).addClass("is-invalid");
                $(this).closest(input_parent).append('<div class="invalid-feedback">Please enter only numeric value.</div>');
                errorFlag = true;
            }
            if($(this).attr("type") == "email" && $(this).val() != "" && !email.test($(this).val())) {
                $(this).addClass("is-invalid");
                $(this).closest(input_parent).append('<div class="invalid-feedback">Please enter valid Email ID.</div>');
                errorFlag = true;
            }
        });
        if($(this).find(".password").val() != $(this).find(".confirm-password").val()) {
            $(this).addClass("is-invalid");
            $(this).find(".confirm-password").closest(input_parent).append("<div class='invalid-feedback'>Confirm password didn't match.</div>");
            errorFlag = true;
        }
        return !errorFlag;
    });
    $("form").on("submit", function(e) {
        is_valid = $(this).is_valid();
        if(!is_valid) {
            e.preventDefault();
        }
    });
});
