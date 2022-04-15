(function ($) {
    $(document).ready(function () {
        $('[data-bs-toggle="tooltip"]').tooltip({ trigger: "hover" });
    });

    let bodyParts = [];

    $(document).on("click", "path.body-part-color", function () {
        const bodyPart = $(this).data("body-part");

        $(this).hasClass("selected")
            ? $(this).removeClass("selected")
            : $(this).addClass("selected");
    });
})(jQuery);
