package com.gvc.ravenloftcastleapi;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.Map;

@SpringBootTest
public class DbSchemaTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void dumpSchema() {
        try {
            System.out.println("=== TABLES ===");
            List<Map<String, Object>> tables = jdbcTemplate.queryForList("SHOW TABLES");
            for (Map<String, Object> table : tables) {
                String tableName = table.values().iterator().next().toString();
                if (tableName.toLowerCase().contains("campa")) {
                    System.out.println("Found match: " + tableName);
                    List<Map<String, Object>> desc = jdbcTemplate.queryForList("DESCRIBE " + tableName);
                    System.out.println("--- DESCRIBE " + tableName + " ---");
                    for (Map<String, Object> row : desc) {
                        System.out.println(row);
                    }
                }
            }
            System.out.println("=== DONE ===");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
