import { supabase } from "./supabase";

export async function createSearchCriteriaTable() {
  try {
    // Check if the table exists by trying to select from it
    const { data, error: checkError } = await supabase
      .from("search_criteria")
      .select("count")
      .limit(1);

    if (!checkError) {
      console.log("search_criteria table already exists");
      return true;
    }

    // If we get here, the table might not exist
    console.log(
      "search_criteria table doesn't exist yet, attempting to create it",
    );

    // Execute the SQL to create the table
    const { error: sqlError } = await supabase.rpc("pgaudit.exec_sql", {
      p_sql: `
        -- Create search_criteria table to store search preferences and results
        CREATE TABLE IF NOT EXISTS public.search_criteria (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          preferences JSONB NOT NULL,
          destinations JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE public.search_criteria ENABLE ROW LEVEL SECURITY;

        -- Create policies
        DROP POLICY IF EXISTS "Users can view their own search criteria" ON public.search_criteria;
        CREATE POLICY "Users can view their own search criteria"
          ON public.search_criteria FOR SELECT
          USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can insert their own search criteria" ON public.search_criteria;
        CREATE POLICY "Users can insert their own search criteria"
          ON public.search_criteria FOR INSERT
          WITH CHECK (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can update their own search criteria" ON public.search_criteria;
        CREATE POLICY "Users can update their own search criteria"
          ON public.search_criteria FOR UPDATE
          USING (auth.uid() = user_id);

        -- Add realtime
        ALTER publication supabase_realtime ADD TABLE public.search_criteria;
      `,
    });

    if (sqlError) {
      console.error("Error creating search_criteria table:", sqlError);
      return false;
    }

    console.log("Successfully created search_criteria table");
    return true;
  } catch (error) {
    console.error("Error in createSearchCriteriaTable:", error);
    return false;
  }
}
