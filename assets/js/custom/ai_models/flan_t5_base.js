import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";
console.log('pipeline: ', pipeline)
let generator = null;
async function initModel() {
    console.log('initModel---------------- ')
    if (generator) return; // already loaded

    console.log("Loading model, please wait...");
    generator = await pipeline(
        "text2text-generation",
        "Xenova/flan-t5-base"
    );
    console.log("Model loaded!");
}
document.addEventListener("DOMContentLoaded", initModel);















// import { pipeline} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";

// let generator = null;

// async function loadModel(text) {
//     // $("#output").text("Loading model, please wait...");
//     console.log('Loading model, please wait...');
//     const generator = await pipeline(
//         "text2text-generation",
//         "Xenova/flan-t5-base"
//     );

//     // $("#output").text("Model loaded! Generating...");
//     console.log('Model loaded! Generating...')


//     // const text = `LuxeSpaces is an award-winning interior design studio known for crafting elegant, modern interiors that reflect your unique lifestyle. Our design philosophy blends functionality with beauty, creating timeless spaces that inspire comfort and sophistication.From residential makeovers to luxury commercial interiors, we specialize in spatial harmony, lighting design, and bespoke material curation — transforming every environment into a work of art.`;
//     let text = text;
//     // Change #1: Use a stronger, more directive instruction
//     const taskInput = `**TASK:** Completely rewrite the following paragraph into a formal business proposal style. Do not keep original phrasing. Ensure all sentences are restructured. **INPUT TEXT:** """${text}""" **OUTPUT TEXT:**`;
//     // The "Output Text" hint sometimes helps guide T5.
//     // const prompt = `Rewrite this paragraph to elevate the tone to a highly professional and sophisticated level, focusing on luxury branding: ${text}`;
    
//     if (!text){
//        return
//     }

//     const output = await generator(taskInput, {
//         max_new_tokens: 600,
//         do_sample: true,   // Enable sampling
//         temperature: 1,  // Increase creativity/variability
//         top_p: 0.9,
//     });
    
//     // $("#output").text(output[0].generated_text);
//     console.log('output[0].generated_text: ', output[0].generated_text)
//     console.log('output: ', output)
//     return output[0].generated_text

// }

// loadModel()