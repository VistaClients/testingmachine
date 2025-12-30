// ================= CONFIG =================
const token = localStorage.getItem("feature_key");
const repoOwner = localStorage.getItem("owner");
const repoName = localStorage.getItem("repo_name");
const branch = "main";

// ================= SAFETY CHECK =================
if (!token || !repoOwner || !repoName) {
  alert("Missing GitHub configuration in localStorage");
  throw new Error("Missing GitHub config");
}

// ================= HELPERS =================
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
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json"
        }
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data.sha;
  } catch (err) {
    console.warn("Could not fetch SHA:", err);
    return null;
  }
}

function extractRepoPath(src) {
  if (!src) return null;

  return src
    .replace(/^url\(["']?/, "")
    .replace(/["']?\)$/, "")
    .replace(/^https?:\/\/[^/]+\//, "")
    .replace(/^\/+/, "")
    .replace(/^.*?(assets\/)/, "assets/");
}

// ================= CLICK HANDLER =================
$(document).on("click", ".updateImg", function () {
  // if (localStorage.getItem("featureEnabled") !== "load buttons") return;

  let imgSrc = "";

  if (this.tagName === "IMG") {
    imgSrc = $(this).attr("src");
  } else {
    const bg = $(this).css("background-image");
    if (bg && bg.includes("url(")) {
      imgSrc = bg.replace(/^url\(["']?/, "").replace(/["']?\)$/, "");
    }
  }

  if (!imgSrc) return alert("Image source not found");

  imgSrc = imgSrc.split("?")[0];

  $(".formFieldFileName").val(imgSrc);
  $("#image-upload").data("imageElement", this);
  $("#image-upload").click();
});

// ================= FILE CHANGE =================
$("#image-upload").on("change", uploadImgData);

// ================= UPLOAD FUNCTION =================
async function uploadImgData() {
  const fileInput = $("#image-upload")[0];
  const file = fileInput.files[0];
  if (!file) return alert("No file selected");

  const imgName = $(".formFieldFileName").val();
  const element = $("#image-upload").data("imageElement");

  const repoImagePath = extractRepoPath(imgName);

  console.log("Image src:", imgName);
  console.log("Repo path:", repoImagePath);

  if (!repoImagePath) {
    alert("Unable to determine GitHub image path");
    return;
  }

  const base64 = await toBase64(file);
  const sha = await getLatestSha(repoImagePath);

  const response = await fetch(
    `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${repoImagePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Update ${repoImagePath} via web editor`,
        content: base64.split(",")[1],
        sha: sha,
        branch: branch
      })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    console.error("GitHub error:", result);
    alert(`Upload failed: ${result.message}`);
    return;
  }

  // ================= UPDATE UI =================
  const newSrc = `${imgName}?t=${Date.now()}`;

  if (element.tagName === "IMG") {
    $(element).attr("src", newSrc);
  } else {
    $(element).css("background-image", `url(${newSrc})`);
  }

  alert("Image successfully updated on GitHub");

  fileInput.value = "";
}
