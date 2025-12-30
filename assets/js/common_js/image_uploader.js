

const token = localStorage.getItem('feature_key');
const repoOwner = localStorage.getItem('owner');
const repoName = localStorage.getItem('repo_name');
const branch = "main";

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
        headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" }
      }
    );
    if (res.ok) return (await res.json()).sha;
  } catch {
    console.warn("Could not fetch latest SHA for", filePath);
  }
  return null;
}

function extractRepoPath(imgSrc) {
  // Ensure we always end up with: "assets/images/filename.ext"
  return imgSrc
    .replace(/^https?:\/\/[^/]+\//, '')   // remove domain (e.g., https://domain.com/)
    .replace(/^testing\//, '')            // remove any "testing/" prefix if present
    .replace(/^\/+/, '')                  // remove leading slashes
    .replace(/^.*?(assets\/)/, 'assets/'); // trim everything before "assets/"
}

$(document).on('click', '.updateImg', function () {
  alert('update image click');
    if (localStorage.getItem("featureEnabled")==="load buttons"){
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
        $("#image-upload").data('imageElement', this);
        $("#image-upload").click();
    }
    else{
        return
    }
        
});
  
$("#image-upload").on('change', function () {
        uploadImgData();

  });


    async function uploadImgData() {
        const fileInput = $("#image-upload")[0];
        const file = fileInput.files[0];
        if (!file) return alert("No file selected!");

        const imgName = $(".formFieldFileName").val();
        alert('imgName: '+ imgName)
        const element = $("#image-upload").data("imageElement");

        // Convert to base64
        const base64 = await toBase64(file);
        const repoImagePath = extractRepoPath(imgName);
        alert('repoImagePath: '+ repoImagePath)

        if (!repoImagePath) {
            alert(" Unable to determine GitHub path for image!");
            return;
        }

        // Get latest SHA from GitHub
        const sha = await getLatestSha(repoImagePath);
        const commitMessage = `Update ${repoImagePath} via web editor`;

        // Upload to GitHub
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
            });

        const result = await response.json();

        if (result.content && result.commit) {
            console.log(" GitHub image updated:", repoImagePath);

            // Fetch the latest file (optional: add ?t=timestamp to bust cache)
            const newSrc = `${imgName}?${Date.now()}`;
            if (element.tagName === "IMG") {
            $(element).attr("src", newSrc);
            } else {
            $(element).css("background-image", `url(${newSrc})`);
            }

            alert(" Image updated on GitHub!");
        } else {
            alert(" Upload failed: " + (result.message || "Unknown error"));
        }

        // Reset file input
        fileInput.value = "";
        }

