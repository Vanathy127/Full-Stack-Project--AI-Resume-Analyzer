$(function () {

  const SKILLS = [
    "react", "javascript", "typescript", "html", "css", "node.js",
    "rest api", "mongodb", "sql", "git", "docker", "python",
    "figma", "bootstrap", "jquery", "tailwind", "aws", "testing"
  ];

  let file = null;

  function showError(msg) {
    $("#err").text(msg).toggleClass("d-none", !msg);
  }

  // ---- File upload: click, keyboard, drag and drop ----

  $("#drop").on("click", () => $("#file").trigger("click"));

  $("#drop").on("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      $("#file").trigger("click");
    }
  });

  $("#file").on("change", function () {
    setFile(this.files[0]);
  });

  $("#drop").on("dragover dragleave drop", function (e) {
    e.preventDefault();

    $(this).toggleClass("over", e.type === "dragover");

    if (e.type === "drop") {
      setFile(e.originalEvent.dataTransfer.files[0]);
    }
  });

  function setFile(f) {

    if (!f) return;

    if (!/\.(pdf|docx?)$/i.test(f.name)) {
      return showError("Upload a PDF or DOCX file.");
    }

    if (f.size > 5 * 1024 * 1024) {
      return showError("That file is over 5 MB. Upload a smaller one.");
    }

    file = f;

    showError("");

    $("#fname").text(f.name);
  }


  // ---- Analyze button ----

  $("#go").on("click", function () {

    const jd = $("#jd").val().toLowerCase();

    if (!file) {
      return showError("Upload your resume first.");
    }

    if (jd.trim().length < 20) {
      return showError(
        "Paste the job description (at least a few lines)."
      );
    }

    showError("");

    const $btn = $(this)
      .prop("disabled", true)
      .text("Analyzing...");


    /*
      TODO (backend):
      Send `file` and `jd` to your API.

      For the frontend demo we compare the
      sample resume with the job description.
    */


    setTimeout(function () {

      const resumeSkills = $("[data-k]")
        .map(function () {
          return $(this).data("k");
        })
        .get();

      const wanted = SKILLS.filter(function (k) {
        return jd.includes(k);
      });

      const found = wanted.filter(function (k) {
        return resumeSkills.includes(k);
      });

      const missing = wanted.filter(function (k) {
        return !resumeSkills.includes(k);
      });

      const pct = wanted.length
        ? Math.round(found.length / wanted.length * 100)
        : 0;


      // Save analysis information for the next pages

      sessionStorage.setItem(
        "resumeFile",
        file.name
      );

      sessionStorage.setItem(
        "jobDescription",
        jd
      );

      sessionStorage.setItem(
        "score",
        pct
      );

      sessionStorage.setItem(
        "foundSkills",
        JSON.stringify(found)
      );

      sessionStorage.setItem(
        "missingSkills",
        JSON.stringify(missing)
      );


      // Open resume preview page

      window.location.href = "preview.html";

    }, 900);

  });


  // ---- Existing results functions ----
  // Keeping these so the original code is not removed.

  function badges(list, cls) {

    if (!list.length) {
      return '<span class="text-secondary">None</span>';
    }

    return list
      .map(function (k) {
        return (
          '<span class="badge rounded-pill text-bg-' +
          cls +
          '">' +
          k +
          "</span>"
        );
      })
      .join("");
  }


  function render(pct, found, missing) {

    $("[data-k]").each(function () {

      $(this).toggleClass(
        "hit",
        found.includes($(this).data("k"))
      );

    });


    $("#pct").text(pct + "%");


    $("#bar")
      .css("width", pct + "%")
      .toggleClass("bg-success", pct >= 70)
      .toggleClass(
        "bg-warning",
        pct >= 40 && pct < 70
      )
      .toggleClass("bg-danger", pct < 40);


    $("#summary").text(
      found.length +
      " of " +
      (found.length + missing.length) +
      " skills from the job description appear in your resume."
    );


    $("#ok").html(
      badges(found, "success")
    );


    $("#miss").html(
      badges(missing, "danger")
    );


    const tips = missing.map(function (k) {

      return (
        "<li>Add <b>" +
        k +
        "</b> to your skills, or show it in a project, if you've used it.</li>"
      );

    });


    tips.push(
      missing.length
        ? "<li>Start each project bullet with what you built and the result.</li>"
        : "<li>Strong match. Add numbers to your project bullets, like users, load time, or team size.</li>"
    );


    $("#tips").html(
      tips.join("")
    );


    $("#results").removeClass("d-none");


    $("html, body").animate(
      {
        scrollTop:
          $("#results").offset().top - 20
      },
      400
    );

  }

});