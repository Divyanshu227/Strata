import { Kafka, Partitioners } from 'kafkajs';

const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

let kafka: Kafka | null = null;
let producer: ReturnType<Kafka['producer']> | null = null;

function getKafkaProducer() {
  if (!kafka) {
    try {
      kafka = new Kafka({
        clientId: 'strata-app',
        brokers: brokers,
        connectionTimeout: 2000,
        requestTimeout: 2000
      });

      // Legacy partitioner keeps compatibility across client versions
      producer = kafka.producer({
        createPartitioner: Partitioners.LegacyPartitioner
      });

      producer.connect().catch((err) => {
        console.warn('Kafka connection error (events suspended):', err.message);
      });
    } catch (e) {
      console.warn('Failed to initialize Kafka producer:', e);
      return null;
    }
  }
  return producer;
}

/**
 * Publishes a MESSAGE_RECEIVED event to the portfolio-messages topic.
 * Returns true if successfully published, false otherwise.
 */
export async function publishMessageEvent(message: {
  id: string;
  projectId: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  createdAt: Date | string;
  spamClassification?: string | null;
  spamScore?: number | null;
}): Promise<boolean> {
  const prod = getKafkaProducer();
  if (!prod) {
    console.warn('Kafka Publisher: Kafka client is not running.');
    return false;
  }

  try {
    const topic = 'strata-messages';
    
    await prod.send({
      topic,
      messages: [
        {
          key: message.id,
          value: JSON.stringify({
            event: 'MESSAGE_RECEIVED',
            payload: message,
            timestamp: new Date().toISOString()
          })
        }
      ]
    });
    console.log(`Kafka Publisher: Successfully emitted event for message ID: ${message.id}`);
    return true;
  } catch (error) {
    console.warn('Kafka publish error:', 
      error instanceof Error ? error.message : error
    );
    return false;
  }
}
