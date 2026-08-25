#!/usr/bin/env python3
"""
WavyGo ERP - Markdown to PDF Generator using ReportLab
Converts docs/ERP_PROJECT_DOCUMENTATION.md to docs/WavyGo_ERP_Project_Documentation.pdf
"""

import sys
import os
import re
from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "WavyGo ERP — Technical & Functional Documentation")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)
        
        footer_text = "WavyGo Enterprise Resource Planning Platform"
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawString(54, 30, footer_text)
        self.drawRightString(558, 30, page_text)
        
        self.restoreState()


def convert_markdown_to_pdf(md_file_path: str, pdf_file_path: str):
    with open(md_file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    doc = SimpleDocTemplate(
        pdf_file_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=12,
    )

    h1_style = ParagraphStyle(
        "H1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True,
    )

    h2_style = ParagraphStyle(
        "H2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0D9488"),
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True,
    )

    h3_style = ParagraphStyle(
        "H3",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#334155"),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=6,
    )

    bullet_style = ParagraphStyle(
        "Bullet",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1E293B"),
        leftIndent=15,
        spaceAfter=3,
    )

    code_style = ParagraphStyle(
        "CodeBlock",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0F172A"),
        backColor=colors.HexColor("#F8FAFC"),
        borderColor=colors.HexColor("#E2E8F0"),
        borderWidth=1,
        borderPadding=6,
        spaceBefore=6,
        spaceAfter=6,
        borderRadius=4,
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
    )

    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1E293B"),
    )

    story = []

    def clean_text(text: str) -> str:
        # Convert markdown bold/italic/code to ReportLab HTML tags
        text = re.sub(r"\*\*(.*?)\*\*", r"<b>\1</b>", text)
        text = re.sub(r"\*(.*?)\*", r"<i>\1</i>", text)
        text = re.sub(r"`(.*?)`", r"<font face='Courier' color='#0D9488'>\1</font>", text)
        # Handle links [text](url)
        text = re.sub(r"\[(.*?)\]\((.*?)\)", r'<font color="#0284C7"><u>\1</u></font>', text)
        return text

    in_code_block = False
    code_lines = []

    in_table = False
    table_raw_rows = []

    def flush_table():
        nonlocal in_table, table_raw_rows
        if not table_raw_rows:
            return
        
        table_data = []
        is_header = True
        for row in table_raw_rows:
            cols = [c.strip() for c in row.strip("|").split("|")]
            # Ignore divider row like |---|---|
            if all(re.match(r"^:?-+:?$", c) for c in cols if c):
                continue
            
            row_data = []
            for col in cols:
                c_text = clean_text(col)
                style = table_header_style if is_header else table_cell_style
                row_data.append(Paragraph(c_text, style))
            
            table_data.append(row_data)
            is_header = False

        if table_data:
            # Determine column widths
            num_cols = max(len(r) for r in table_data)
            avail_width = 504 # 612 - 54*2
            col_width = avail_width / max(num_cols, 1)
            col_widths = [col_width] * num_cols

            t = Table(table_data, colWidths=col_widths)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0F172A")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('LEFTPADDING', (0, 0), (-1, -1), 5),
                ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ]))
            story.append(t)
            story.append(Spacer(1, 8))

        in_table = False
        table_raw_rows = []

    for line in lines:
        line_str = line.rstrip("\n")

        # Code block handling
        if line_str.startswith("```"):
            if in_code_block:
                code_text = "\n".join(code_lines)
                # Replace special HTML entities for ReportLab code display
                code_text_clean = code_text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                story.append(Paragraph(code_text_clean.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style))
                story.append(Spacer(1, 4))
                code_lines = []
                in_code_block = False
            else:
                if in_table:
                    flush_table()
                in_code_block = True
            continue

        if in_code_block:
            code_lines.append(line_str)
            continue

        # Table handling
        if "|" in line_str and line_str.strip().startswith("|"):
            if not in_table:
                in_table = True
            table_raw_rows.append(line_str)
            continue
        elif in_table:
            flush_table()

        # Empty lines
        if not line_str.strip():
            story.append(Spacer(1, 4))
            continue

        # Horizontal Rule
        if line_str.strip() in ["---", "***", "___"]:
            story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E2E8F0"), spaceBefore=8, spaceAfter=8))
            continue

        # Headers
        if line_str.startswith("# "):
            story.append(Paragraph(clean_text(line_str[2:]), title_style))
            story.append(Spacer(1, 4))
        elif line_str.startswith("## "):
            story.append(Paragraph(clean_text(line_str[3:]), h1_style))
            story.append(Spacer(1, 2))
        elif line_str.startswith("### "):
            story.append(Paragraph(clean_text(line_str[4:]), h2_style))
            story.append(Spacer(1, 2))
        elif line_str.startswith("#### "):
            story.append(Paragraph(clean_text(line_str[5:]), h3_style))
            story.append(Spacer(1, 2))
        # Bullet points
        elif line_str.strip().startswith("- ") or line_str.strip().startswith("* "):
            bullet_text = "• " + clean_text(line_str.strip()[2:])
            story.append(Paragraph(bullet_text, bullet_style))
        elif re.match(r"^\d+\.\s", line_str.strip()):
            num_text = clean_text(line_str.strip())
            story.append(Paragraph(num_text, bullet_style))
        else:
            story.append(Paragraph(clean_text(line_str), body_style))

    if in_table:
        flush_table()

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"✅ Successfully generated PDF: {pdf_file_path}")


if __name__ == "__main__":
    md_path = "/Users/garvagarwal/app-1/docs/ERP_PROJECT_DOCUMENTATION.md"
    pdf_path = "/Users/garvagarwal/app-1/docs/WavyGo_ERP_Project_Documentation.pdf"
    convert_markdown_to_pdf(md_path, pdf_path)
