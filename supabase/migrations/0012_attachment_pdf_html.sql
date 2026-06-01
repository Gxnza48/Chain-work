-- ============================================================================
-- ChainWork — 0012_attachment_pdf_html.sql
-- Extend attachment_type with 'pdf' and 'html' so the Links & Media section can
-- host uploaded PDF documents (previewed inline) and .html files (opened in a
-- new window). Files live in the existing public `attachments` storage bucket,
-- so no new bucket or policy is required.
-- ============================================================================

alter type public.attachment_type add value if not exists 'pdf';
alter type public.attachment_type add value if not exists 'html';
