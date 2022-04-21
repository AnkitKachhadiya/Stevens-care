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

    $(document).on("click", "button#submit-case", function () {
        $("#error").addClass("d-none");
        const description = $("#description").val().trim();
        const painRange = $("#pain-range").val();
        const question1 = $("#question-1").val().trim();
        const question2 = $("#question-2").val().trim();
        const question3 = $("#question-3").val().trim();
        const firstTimeProblem = $(
            "input[name='first-time-problem']:checked"
        ).val();

        if (validator.isEmpty(description)) {
            $("#body-parts-card").get(0).scrollIntoView();
            $("#error").removeClass("d-none");
            return false;
        }

        const patientCase = {
            bodyPartsIds,
            description,
            painRange,
            question1,
            question2,
            question3,
            firstTimeProblem: firstTimeProblem || null,
        };

        submitPatientCaseForm(patientCase);
    });

    function submitPatientCaseForm(patientCase) {
        $.ajax({
            url: "/cases/addCase",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(patientCase),
            beforeSend: function () {
                $("#loader-container").removeClass("d-none");
            },
            success: function () {
                // window.location.href = "/users/profile";
            },
            complete: function () {
                $("#loader-container").addClass("d-none");
            },
            error: function (data) {
                $("#error-message").html(data.responseJSON.error);
                $("#error-message").removeClass("d-none");
            },
        });
    }
})(jQuery);
