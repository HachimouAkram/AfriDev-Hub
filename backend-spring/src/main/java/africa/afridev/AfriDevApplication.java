package africa.afridev;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class AfriDevApplication {

    public static void main(String[] args) {
        SpringApplication.run(AfriDevApplication.class, args);
    }
}
