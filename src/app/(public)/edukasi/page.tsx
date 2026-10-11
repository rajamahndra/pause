import { getArticles } from "@/lib/education";
import { EducationList } from "@/features/education/list";
export const metadata={title:"Ruang belajar"};
export default function Page(){return <main id="main" className="narrow education-list-page"><div className="page-intro"><span className="eyebrow">RUANG BELAJAR</span><h1>Memahami,<br/><em>sedikit demi sedikit.</em></h1><p>Bacaan singkat untuk menemani prosesmu. Tidak perlu dipahami sekaligus.</p></div><EducationList articles={getArticles().map(a=>{const {content,...meta}=a; void content; return meta;})}/></main>;}
