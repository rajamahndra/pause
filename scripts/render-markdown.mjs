import { marked,Renderer } from "marked";
import sanitizeHtml from "sanitize-html";
/** @param {string} source */
export async function renderMarkdown(source){
 const renderer=new Renderer();renderer.html=()=>"";
 return sanitizeHtml(await marked.parse(source,{renderer}),{allowedTags:sanitizeHtml.defaults.allowedTags,allowedAttributes:{a:["href","title"]},allowedSchemes:["https","http"]});
}
