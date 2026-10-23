
$(function () {

  const SKILLS = [
    "react",
    "javascript",
    "typescript",
    "html",
    "css",
    "node.js",
    "rest api",
    "mongodb",
    "sql",
    "git",
    "docker",
    "python",
    "figma",
    "bootstrap",
    "jquery",
    "tailwind",
    "aws",
    "testing"
  ];

  let file = null;


  // =====================================================
  // ERROR MESSAGE
  // =====================================================

  function showError(msg) {

    $("#err")
      .text(msg)
      .toggleClass("d-none", !msg);

  }


  // =====================================================
  // FILE UPLOAD
  // =====================================================

  $("#drop").on("click", function () {

    $("#file").trigger("click");

  });


  $("#drop").on("keydown", function (e) {

    if (e.key === "Enter" || e.key === " ") {

      e.preventDefault();

      $("#file").trigger("click");

    }

  });


  $("#file").on("change", function () {

    setFile(this.files[0]);

  });


  // =====================================================
  // DRAG AND DROP
  // =====================================================

  $("#drop").on("dragover", function (e) {

    e.preventDefault();

    $(this).addClass("over");

  });


  $("#drop").on("dragleave", function (e) {

    e.preventDefault();

    $(this).removeClass("over");

  });


  $("#drop").on("drop", function (e) {

    e.preventDefault();

    $(this).removeClass("over");

    const droppedFile =
      e.originalEvent.dataTransfer.files[0];

    setFile(droppedFile);

  });


  // =====================================================
  // FILE VALIDATION
  // =====================================================

  function setFile(f) {

    if (!f) {
      return;
    }

    const validFile = /\.(pdf|doc|docx)$/i.test(f.name);

    if (!validFile) {

      file = null;

      $("#file").val("");

      $("#fname").text(
        "Drop your resume here"
      );

      $("#drop").removeClass(
        "file-selected"
      );

      return showError(
        "Upload a PDF, DOC or DOCX file."
      );

    }


    if (f.size > 5 * 1024 * 1024) {

      file = null;

      $("#file").val("");

      $("#fname").text(
        "Drop your resume here"
      );

      $("#drop").removeClass(
        "file-selected"
      );

      return showError(
        "That file is over 5 MB. Upload a smaller one."
      );

    }


    file = f;

    showError("");

    $("#fname").text(
      f.name
    );

    $("#drop").addClass(
      "file-selected"
    );

  }


  // =====================================================
  // ANALYZE BUTTON
  // =====================================================

  $("#go").on("click", function () {

    const jd =
      $("#jd")
        .val()
        .trim();


    // Resume required

    if (!file) {

      return showError(
        "Upload your resume first."
      );

    }


    // Job description required

    if (jd.length < 20) {

      return showError(
        "Paste the job description (at least a few lines)."
      );

    }


    // Login required

    const token = sessionStorage.getItem("token");

    if (!token) {

      sessionStorage.setItem("afterLogin", "analyze.html");

      window.location.href = "login.html";

      return;

    }


    showError("");

    const $btn = $(this);

    const originalButtonHTML = $btn.html();


    // Loading state

    $btn
      .prop("disabled", true)
      .html(
        '<span class="spinner-border spinner-border-sm me-2"></span>' +
        'Analyzing...'
      );


    // =====================================================
    // SEND RESUME AND JOB DESCRIPTION TO BACKEND
    // =====================================================

    const fd = new FormData();

    fd.append("resume", file);

    fd.append("jd", jd);


    $.ajax({
      url: "/api/analyze",
      method: "POST",
      data: fd,
      processData: false,
      contentType: false,
      headers: {
        Authorization: "Bearer " + token
      }
    })

    .done(function (data) {

            sessionStorage.setItem(
        "result",
        JSON.stringify(data)
      );

      sessionStorage.setItem("resumeFile", file.name);
      
      window.location.href = "preview.html";

    })

    .fail(function (xhr) {

      const message =
        xhr.responseJSON?.message ||
        "Analysis failed. Please try again.";

      showError(message);

      if (xhr.status === 401) {

        sessionStorage.removeItem("token");

        sessionStorage.removeItem("user");

        sessionStorage.setItem("afterLogin", "analyze.html");

        window.location.href = "login.html";

      }

    })

    .always(function () {

      $btn
        .prop("disabled", false)
        .html(originalButtonHTML);

    });

  });


  // =====================================================
  // OLD RESULT FUNCTIONS
  // =====================================================
  //
  // These are kept so older HTML sections still work
  // if they are used anywhere in the project.
  //
  // =====================================================


  function badges(list, cls) {

    if (!list.length) {

      return (
        '<span class="text-secondary">' +
        'None' +
        '</span>'
      );

    }


    return list

      .map(function (skill) {

        return (
          '<span class="badge rounded-pill text-bg-' +
          cls +
          ' me-1">' +
          skill +
          '</span>'
        );

      })

      .join("");

  }


  function render(pct, found, missing) {

    // Highlight matched skills

    $("[data-k]").each(function () {

      const skill =
        String(
          $(this).data("k")
        ).toLowerCase();

      $(this).toggleClass(
        "hit",
        found.includes(skill)
      );

    });


    // Percentage

    $("#pct").text(
      pct + "%"
    );


    // Progress bar

    $("#bar")
      .css(
        "width",
        pct + "%"
      )
      .toggleClass(
        "bg-success",
        pct >= 70
      )
      .toggleClass(
        "bg-warning",
        pct >= 40 && pct < 70
      )
      .toggleClass(
        "bg-danger",
        pct < 40
      );


    // Summary

    $("#summary").text(

      found.length +

      " of " +

      (found.length + missing.length) +

      " skills from the job description appear in your resume."

    );


    // Found skills

    $("#ok").html(

      badges(
        found,
        "success"
      )

    );


    // Missing skills

    $("#miss").html(

      badges(
        missing,
        "danger"
      )

    );


    // Tips

    const tips =

      missing.map(function (skill) {

        return (
          "<li>Add <b>" +
          skill +
          "</b> to your skills, or show it in a project, if you've used it.</li>"
        );

      });


    if (missing.length) {

      tips.push(

        "<li>Start each project bullet with what you built and the result.</li>"

      );

    }
    else {

      tips.push(

        "<li>Strong match. Add numbers to your project bullets, like users, load time, or team size.</li>"

      );

    }


    $("#tips").html(
      tips.join("")
    );


    $("#results")
      .removeClass("d-none");


    if ($("#results").length) {

      $("html, body").animate(

        {

          scrollTop:
            $("#results").offset().top - 20

        },

        400

      );

    }

  }

});
