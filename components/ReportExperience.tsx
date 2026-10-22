"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { MarriageStoryReport } from "@/lib/report/types";
import {localizeReport,type ReportLanguage,hindiSign,hindiPlanet} from "@/lib/report/localize";
import "@/app/report/view.css";

const chapterGlyph=["♡","✧","✦","◷","☾","✳","❀"];
const labels=["THE PATH","THE HEART","THE CONNECTION","THE SEASONS","LIFE TOGETHER","THE WHY","THE KEEPSAKE"];
const labelsHi=["आपकी पसंद","प्रेम स्वभाव","साझेदारी","दशा","साथ","आधार","आपकी कहानी"];

export function ReportExperience({report,demo=false}:{report:MarriageStoryReport;demo?:boolean}){
  const [expandedEvidence,setExpandedEvidence]=useState<string[]>([]);
  const [active,setActive]=useState(0);
  const [lang,setLang]=useState<ReportLanguage>("en");
  const view=useMemo(()=>localizeReport(report,lang),[report,lang]);
  const hi=lang==="hi";
  const date=useMemo(()=>new Date(view.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}),[view.createdAt]);
  function toggle(id:string){setExpandedEvidence(x=>x.includes(id)?x.filter(s=>s!==id):[...x,id]);}
  function jump(index:number){
    setActive(index);
    document.getElementById("lovora-chapter-"+(index+1))?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"start"});
  }

  return <main className={"report-site"+(hi?" report-site--hi":"")} lang={lang}>
    <header className="report-header">
      <div className="report-header__inner">
        <Link href="/" className="report-header__brand"><span className="report-header__star">✦</span> LOVORA</Link>
        <div className="report-header__right">
          {demo&&<span className="report-demo-label">{hi?"सिर्फ़ उदाहरण":"ILLUSTRATIVE SAMPLE"}</span>}
          <button type="button" className="report-header__print" onClick={()=>setLang(hi?"en":"hi")}>{hi?"English":"हिंदी"}</button>
          <button type="button" className="report-header__print" onClick={()=>window.print()} title="Save or print the report">⇩ <span>{hi?"PDF सेव करें":"Save PDF"}</span></button>
        </div>
      </div>
    </header>

    {demo&&<div className="report-demo-alert" role="note"><strong>Sample only.</strong> This fictional chart and report are for demonstrating the product design. No birth data was calculated for you.</div>}

    <section className="report-cover">
      <div className="report-cover__glow" aria-hidden="true"/>
      <div className="report-cover__inner">
        <p className="report-kicker">✦ AN INTIMATE JOURNEY THROUGH THE STARS ✦</p>
        <div className="report-cover__illustration" aria-hidden="true">
          <div className="report-cover__outer-orbit" />
          <div className="report-cover__inner-orbit" />
          <div className="report-cover__central-star">☾</div>
          <span className="report-cover__accent report-cover__accent--one">✦</span>
          <span className="report-cover__accent report-cover__accent--two">✧</span>
          <span className="report-cover__accent report-cover__accent--three">✦</span>
        </div>
        <p className="report-cover__eyebrow">THE PERSONAL MARRIAGE READING</p>
        <h1>{view.person.firstName?view.person.firstName+"'s":"Your"} <em>Marriage Story</em></h1>
        <p className="report-cover__sub">A story of love, partnership and the beautiful unknown.</p>
        <div className="report-cover__meta"><span>{view.chart.rising} Rising</span><i/><span>{date}</span><i/><span>Seven Chapters</span></div>
        <p className="report-cover__note">A symbolic reading based on traditional Vedic astrology — not a guaranteed prediction.</p>
      </div>
    </section>

    <div className="report-body">
      <div className="report-layout">
        <aside className="report-sidebar" aria-label="Report chapters">
          <div className="report-sidebar__sticky">
            <div className="report-sidebar__heading">YOUR SEVEN CHAPTERS</div>
            <nav>
              {view.chapters.map((chapter,i)=>(
                <button type="button" key={chapter.id} className={"report-sidebar__item"+(active===i?" is-active":"")} onClick={()=>jump(i)}>
                  <span>{String(i+1).padStart(2,"0")}</span>
                  <span>{chapter.title}</span>
                  {active===i&&<span className="report-sidebar__active-mark">✦</span>}
                </button>
              ))}
            </nav>
            <p>Written from your verified planetary placements. Not a scientific forecast.</p>
          </div>
        </aside>
        <div className="report-content">
          <section className="report-summary">
            <p className="report-eyebrow">✧ THE BEGINNING</p>
            <h2>A glimpse of your <em>celestial story.</em></h2>
            <div className="report-summary__highlight">
              <span>YOUR CENTRAL THEME</span>
              <h3>{view.marriagePath.headline}</h3>
              <p>{view.marriagePath.summary}</p>
            </div>
            <div className="report-summary__facts">
              <div><span>RISING SIGN</span><strong>{view.chart.rising}</strong></div>
              <div><span>ROMANCE HOUSE</span><strong>{view.chart.fifth}</strong></div>
              <div><span>PARTNERSHIP HOUSE</span><strong>{view.chart.seventh}</strong></div>
            </div>
            <p className="report-summary__caveat">✦ {view.marriagePath.caveat}</p>
          </section>

          {view.chapters.map((chapter,index)=>(
            <article id={"lovora-chapter-"+chapter.number} className="report-chapter" key={chapter.id}>
              <div className="report-chapter__intro">
                <div className="report-chapter__decor" aria-hidden="true">{chapterGlyph[index]}</div>
                <p className="report-eyebrow">{String(chapter.number).padStart(2,"0")} / 07 — {labels[index]}</p>
                <h2>{chapter.title}</h2>
                <p className="report-chapter__lead">{chapter.introduction}</p>
              </div>
              {chapter.paragraphs.map((paragraph,idx)=><p className="report-chapter__paragraph" key={idx}>{paragraph}</p>)}

              {chapter.id==="timing"&&view.timing.windows.length>0&&
                <div className="report-timeline">
                  {view.timing.windows.map((window,i)=>(
                    <div key={i} className="report-timeline__item">
                      <span className="report-timeline__marker"/>
                      <div><strong>{window.name} Dasha</strong><p>{window.start} — {window.end}</p><small>{window.why}</small></div>
                    </div>
                  ))}
                </div>
              }

              {chapter.id==="evidence"&&<div className="report-chart-table">
                <div className="report-chart-table__header"><span>ACTUAL CHART PLACEMENTS</span><span>WHOLE-SIGN HOUSE</span></div>
                {view.chart.planets.map(planet=><div className="report-chart-table__row" key={planet.name}>
                  <span><b>{planet.name}</b> <small>{planet.sign}</small></span>
                  <span>{planet.wholeSignHouse}</span>
                </div>)}
              </div>}

              {chapter.evidenceIds.length>0&&<div className="report-evidence">
                <p className="report-evidence__heading">✧ THE CHART BEHIND THIS CHAPTER</p>
                {chapter.evidenceIds.map(id=>{
                  const item=view.evidence.find(ev=>ev.id===id);
                  if(!item)return null;
                  const isOpen=expandedEvidence.includes(chapter.id+"-"+id);
                  return <div className="report-evidence__item" key={id}>
                    <button type="button" aria-expanded={isOpen} onClick={()=>toggle(chapter.id+"-"+id)}>
                      <span><i>✦</i>{item.title}</span><b>{isOpen?"−":"+"}</b>
                    </button>
                    {isOpen&&<div className="report-evidence__detail">
                      <strong>Observed: {item.observation}</strong>
                      <p>{item.meaning}</p>
                    </div>}
                  </div>;
                })}
              </div>}
              {chapter.note&&<div className="report-chapter__footnote">✧ {chapter.note}</div>}
              {index===6&&<div className="report-final"><span>✦</span><h3>The rest of your story is yours to write.</h3><button type="button" onClick={()=>window.print()}>Save your keepsake ↓</button></div>}
            </article>
          ))}
          <div className="report-method">
            <h3>How your reading was made</h3>
            <p>Astrological source: {view.source.provider} · {view.source.ayanamsa} sidereal positions. Houses use a whole-sign interpretation from the verified rising sign.</p>
            <p>Used: {view.source.methods.join(" · ")}.</p>
            {view.source.partial.length>0&&<p>Data limitations: {view.source.partial.join(" · ")}.</p>}
            <p>{view.disclaimer}</p>
          </div>
        </div>
      </div>
    </div>
    <footer className="report-footer"><span>✦ LOVORA</span><p>Every heart has its own story.</p><Link href="/">Back to LOVORA ↑</Link></footer>
  </main>;
}
