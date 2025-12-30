$(document).ready(function () {

  /* ===============================
     Setup / Init
  =============================== */

  var wrapper = $('#wrapper').addClass('editableSection');
  $('<div>', { id: 'top-bar', class: 'top-bar' }).insertBefore(wrapper);

  const token = localStorage.getItem('feature_key');
  const repoOwner = localStorage.getItem('owner');
  const repoName = localStorage.getItem('repo_name');
  const branch = "main";

  /* ===============================
     Dynamic DOM helpers
  =============================== */

  function createUploadDom() {
    if ($("#imgForm").length) return;

    $('<form>', {
      method: 'post',
      id: 'imgForm',
      enctype: 'multipart/form-data'
    }).appendTo('body');

    $('<input>', {
      type: 'file',
      id: 'image-upload',
      name: 'imgFile',
      accept: 'image/*'
    })
      .appendTo('#imgForm')
      .css({
        position: 'absolute',
        left: '-9999px',
        opacity: 0,
        width: '1px',
        height: '1px'
      });

    $('<input>', {
      type: 'text',
      class: 'formFieldFileName',
      name: 'imgFileName'
    })
      .appendTo('#imgForm')
      .css({
        position: 'absolute',
        left: '-9999px',
        opacity: 0
      });

    // Bind change event once
    $("#image-upload").on('change', uploadImgData);
  }

  function cleanupUploadDom() {
    $("#image-upload").off().remove();
    $(".formFieldFileName").remove();
    $("#imgForm").remove();
  }

  /* ===============================
     Helpers
  =============================== */

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  }

  async function getLatestSha(filePath) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github+json"
          }
        }
      );
      if (res.ok) return (await res.json()).sha;
    } catch {
      console.warn("Could not fetch latest SHA for", filePath);
    }
    return null;
  }

  function extractRepoPath(imgSrc) {
    return imgSrc
      .replace(/^https?:\/\/[^/]+\//, '')
      .replace(/^testing\//, '')
      .replace(/^\/+/, '')
      .replace(/^.*?(assets\/)/, 'assets/');
  }

  /* ===============================
     Events
  =============================== */

 $(document).on('click', '.updateImg', function () {
  if (!token) return;

  createUploadDom();

  const fileInput = $("#image-upload")[0];
  if (!fileInput) {
    console.error("File input was not created!");
    return;
  }

  let imgName = "default";

  if ($(this).attr("src")) {
    imgName = $(this).attr("src");
  } else {
    const bgImg = $(this).css('background-image');
    if (bgImg && bgImg.includes('url(')) {
      imgName = bgImg.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    }
  }

  if (imgName.includes("?")) imgName = imgName.split("?")[0];

  $(".formFieldFileName").val(imgName);
  $(fileInput).data('imageElement', this);

  //  Safe click
  fileInput.click();
});


  /* ===============================
     Upload logic
  =============================== */

  async function uploadImgData() {
    const fileInput = $("#image-upload")[0];
    const file = fileInput.files[0];
    if (!file) {
      cleanupUploadDom();
      return;
    }

    const imgName = $(".formFieldFileName").val();
    const element = $("#image-upload").data("imageElement");

    try {
      const base64 = await toBase64(file);
      const repoImagePath = extractRepoPath(imgName);

      if (!repoImagePath) {
        alert("Unable to determine GitHub path for image!");
        cleanupUploadDom();
        return;
      }

      const sha = await getLatestSha(repoImagePath);
      const commitMessage = `Update ${repoImagePath} via web editor`;

      const response = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${repoImagePath}`,
        {
          method: "PUT",
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: commitMessage,
            content: base64.split(",")[1],
            sha: sha,
            branch: branch,
          }),
        }
      );

      const result = await response.json();

      if (result.content && result.commit) {
        const newSrc = `${imgName}?${Date.now()}`;

        if (element.tagName === "IMG") {
          $(element).attr("src", newSrc);
        } else {
          $(element).css("background-image", `url(${newSrc})`);
        }

        alert("Image updated on GitHub!");
      } else {
        alert("Upload failed: " + (result.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Unexpected error during upload");
    }

    // Always clean up
    cleanupUploadDom();
  }

  /* ===============================
     Safety cleanup
  =============================== */

  $(window).on('beforeunload', cleanupUploadDom);

});
