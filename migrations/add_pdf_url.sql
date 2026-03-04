-- Add pdf_url column to books_list table
ALTER TABLE books_list ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN books_list.pdf_url IS 'URL to the PDF file stored in COS for reading the full book';
