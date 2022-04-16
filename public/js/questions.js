(function ($) {
    $(document).ready(function () {
        $('[data-bs-toggle="tooltip"]').tooltip({ trigger: "hover" });
    });

    let bodyPartsIds = [];
    let bodyPartsData = [];

    $(document).on("click", "path.body-part-color", function () {
        const bodyPartId = $(this).data("body-part-id");
        const bodyPart = $(this).data("body-part");

        $(this).hasClass("selected")
            ? removeFromBodyParts(bodyPartId, bodyPart)
            : addToBodyParts(bodyPartId, bodyPart);

        $(this).hasClass("selected")
            ? $(this).removeClass("selected")
            : $(this).addClass("selected");

        renderBodyPartsList();
    });

    function addToBodyParts(bodyPartId, bodyPart) {
        bodyPartsIds.push(bodyPartId);
        bodyPartsData.push(bodyPart);
    }

    function removeFromBodyParts(bodyPartId, bodyPart) {
        bodyPartsIds = bodyPartsIds.filter(
            (currentBodyPartId) => currentBodyPartId !== bodyPartId
        );

        bodyPartsData = bodyPartsData.filter(
            (currentBodyPartData) => currentBodyPartData !== bodyPart
        );
    }

    function renderBodyPartsList() {
        $("#body-parts-wrapper").html("");

        if (bodyPartsData.length < 1) {
            $("#body-parts-wrapper").html(
                `<span class="badge rounded-pill bg-dark body-parts-pill">none</span>`
            );
            return;
        }

        let html = ``;

        for (currentBodyPart of bodyPartsData) {
            html += `<span class="badge rounded-pill bg-primary body-parts-pill">${currentBodyPart}</span>`;
        }

        $("#body-parts-wrapper").html(html);
    }
})(jQuery);
