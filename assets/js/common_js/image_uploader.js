$(document).ready(function () {

    // ---------------- INIT ----------------
    $('<form method="post" id="imgForm" enctype="multipart/form-data">').appendTo('body');
    $('<input type="file" id="image-upload" class="hidden" accept="image/*">').appendTo('#imgForm');
    $('<input type="text" class="hidden formFieldFileName">').appendTo('#imgForm');

    const token = localStorage.getItem('feature_key');
    const repoOwner = localStorage.getItem('owner');
    const repoName = localStorage.getItem('repo_name');
    const branch = "main";

    // ---------------- UTILS ----------------
    function toBase64(file) {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.readAsDataURL(file);
            r.onload = () => resolve(r.result);
            r.onerror = reject;
        });
    }

    async function getLatestSha(filePath) {
        try {
            const r = await fetch(
                `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`,
                { headers: { Authorization: `token ${token}` } }
            );
            if (r.ok) return (await r.json()).sha;
        } catch { }
        return null;
    }

    function extractRepoPath(originalSrc) {
        return originalSrc.replace(/^\/+/, '');
    }

    // ---------------- OPEN FILE PICKER ----------------
    $(document).on('click', '.updateImg', function () {

        if (localStorage.getItem("featureEnabled") !== "load buttons") return;

        const originalSrc = $(this).attr("data-original-src");
        if (!originalSrc) {
            alert("data-original-src missing on element!");
            return;
        }

        $(".formFieldFileName").val(originalSrc);
        $("#image-upload").data("imageElement", this);
        $("#image-upload").click();
    });

    // ---------------- HANDLE FILE SELECTION ----------------
    $("#image-upload").on("change", uploadImgData);

    async function uploadImgData() {

        const file = $("#image-upload")[0].files[0];
        if (!file) return;

        const originalSrc = $(".formFieldFileName").val();
        const element = $("#image-upload").data("imageElement");

        const base64 = await toBase64(file);
        const repoPath = extractRepoPath(originalSrc);
        const sha = await getLatestSha(repoPath);

        const res = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${repoPath}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `token ${token}`,
                    Accept: "application/vnd.github+json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: `Update ${repoPath} via CMS`,
                    content: base64.split(",")[1],
                    sha: sha,
                    branch: branch
                })
            }
        );

        const result = await res.json();

        if (!result.content) {
            alert("Upload failed: " + (result.message || "Unknown error"));
            return;
        }

        const newSrc = `${originalSrc}?v=${Date.now()}`;

        if (element.tagName === "IMG") {
            $(element).attr("src", newSrc);
        } else {
            $(element).css("background-image", `url("${newSrc}")`);
        }

        $("#image-upload")[0].value = "";
        alert("Image updated successfully!");
    }
});
